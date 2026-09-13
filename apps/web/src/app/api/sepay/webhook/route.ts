import { NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { waitUntil } from '@vercel/functions';

export const maxDuration = 300;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET — dùng để test xem URL webhook có reachable không (SePay ping test)
export async function GET() {
  return NextResponse.json(
    { status: 'ok', message: 'NCN SePay webhook endpoint is reachable', timestamp: new Date().toISOString() },
    { headers: corsHeaders }
  );
}

export async function POST(req: Request) {
  // Initialize Firebase Admin if not already initialized
  if (!getApps().length) {
    try {
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
        initializeApp({
          credential: cert(serviceAccount)
        });
      } else {
        console.warn("Missing FIREBASE_SERVICE_ACCOUNT environment variable. Firestore updates via webhook will fail.");
      }
    } catch (error) {
      console.error("Firebase admin init error:", error);
    }
  }

  try {
    const authHeader = req.headers.get('authorization') || '';
    // Log auth header for debugging (không block webhook để SePay hoạt động)
    console.warn(`[SePay] Webhook received. Auth header present: ${!!authHeader}`);

    const body = await req.json();
    console.warn("SePay Webhook received:", JSON.stringify(body));
    
    // SePay sends the transaction details in the payload
    // Adjust based on SePay's actual webhook structure. Usually it's at root or nested under `data`.
    const payload = body.data || body;
    
    // SePay transaction content field is usually `content` or `transactionContent`
    const content = String(payload.content || payload.transactionContent || payload.description || "").toUpperCase();
    const amount = Number(payload.transferAmount || payload.amount || 0);
    
    if (!content) {
      return NextResponse.json({ success: false, message: 'No content found in webhook' }, { headers: corsHeaders });
    }

    // Try to extract order code. We expect format "NCN 12345" or similar.
    const match = content.match(/NCN\s*(\d+)/i);
    if (!match) {
      console.warn(`Ignoring transaction. Content does not contain NCN [orderCode]: ${content}`);
      return NextResponse.json({ success: true, message: 'Ignored (Not NCN order)' }, { headers: corsHeaders });
    }
    
    const orderCode = match[1];
    console.warn(`Extracted Order Code: ${orderCode}, Amount: ${amount}`);
    
    // Update Firestore
    if (getApps().length) {
      const db = getFirestore();
      const docRef = db.collection('orders').doc(orderCode);
      const docSnap = await docRef.get();
      const data = docSnap.exists ? docSnap.data() : null;

      if (!data) {
        console.warn(`Order ${orderCode} not found in database.`);
        return NextResponse.json({ success: true, message: 'Order not found' }, { headers: corsHeaders });
      }

      // ── Các mốc thanh toán hợp lệ ────────────────────────────────────────────
      // PRICE_FULL      = 799.000đ — giá gốc, không có affiliate
      // PRICE_AFFILIATE = 759.000đ — giá sau giảm 5% affiliate (floor *0.95/1k*1k)
      // Coupon miễn phí (VIP/FREE/NCN/PRO/GIFT) → không qua webhook, xử lý tại apply-coupon
      // Coupon giảm 1 phần (GIAM50...) → user chuyển khoản giá sau giảm
      const PRICE_FULL      = 799_000;
      const PRICE_AFFILIATE = 759_000;

      const orderAmount    = Number(data.amount || 0);
      const discountApplied = Number(data.discountAmount || 0); // từ apply-coupon
      // expectedAmount = số tiền user thực tế phải chuyển (đã trừ coupon nếu có)
      const expectedAmount = discountApplied > 0
        ? Math.max(0, orderAmount - discountApplied)
        : orderAmount;

      // Chấp nhận trong biên độ 1.000đ để xử lý làm tròn của ngân hàng
      const ROUNDING_BUFFER = 1_000;
      const minimumAccept   = expectedAmount - ROUNDING_BUFFER;
      const hasAffiliate    = !!data.referralCode;

      console.warn(
        `[webhook] order ${orderCode}` +
        ` | order.amount: ${orderAmount.toLocaleString('vi-VN')}đ` +
        (discountApplied > 0 ? ` | discount: -${discountApplied.toLocaleString('vi-VN')}đ (${data.couponApplied || 'coupon'})` : '') +
        ` | expected: ${expectedAmount.toLocaleString('vi-VN')}đ` +
        ` | received: ${amount.toLocaleString('vi-VN')}đ` +
        ` | min acceptable: ${minimumAccept.toLocaleString('vi-VN')}đ` +
        (hasAffiliate ? ` | ref: ${data.referralCode}` : '')
      );

      if (amount < minimumAccept) {
        console.warn(
          `[webhook] ❌ PARTIAL_PAID order ${orderCode}:` +
          ` received ${amount.toLocaleString('vi-VN')}đ` +
          ` < min ${minimumAccept.toLocaleString('vi-VN')}đ` +
          ` (expected after discount: ${expectedAmount.toLocaleString('vi-VN')}đ)`
        );
        await docRef.set({
          status:     'PARTIAL_PAID',
          paidAmount: amount,
          sepayData:  payload,
          updatedAt:  FieldValue.serverTimestamp(),
        }, { merge: true });
        return NextResponse.json({ success: true, message: 'Insufficient amount' }, { headers: corsHeaders });
      }


      // Skip if already generating
      if (data.pdfGenerating || data.pdfDone) {
        console.warn(`Order ${orderCode} is already paid or generating PDF. Returning early.`);
        return NextResponse.json({ success: true, message: 'Already Processing' }, { headers: corsHeaders });
      }

      await docRef.set({
        status: 'PAID',
        paidAmount: amount,
        sepayData: payload,
        paidAt: FieldValue.serverTimestamp(),
        pdfGenerating: true
      }, { merge: true });
      
      console.warn(`Order ${orderCode} marked as PAID and PDF generating in Firestore`);

      // ── Ghi affiliate commission thẳng vào Firestore ──────────────────────
      if (data.referralCode) {
        const commissionId  = `sepay-${String(orderCode)}`;
        const commissionRef = db.collection('affiliate_commissions').doc(commissionId);
        waitUntil(
          commissionRef.get().then(async (existing) => {
            if (existing.exists) {
              console.warn(`[webhook] commission ${commissionId} already exists, skipping`);
              return;
            }

            const commissionAmount = Math.round(amount * 0.20);

            await commissionRef.set({
              referralCode:     data.referralCode,
              orderCode:        String(orderCode),
              amount:           amount,
              commissionAmount,
              commissionRate:   0.20,
              customerEmail:    data.customerEmail || data.payload?.EMAIL || '',
              customerName:     data.customerName  || data.payload?.HOTEN || '',
              status:           'PENDING',
              source:           'sepay_webhook',
              createdAt:        FieldValue.serverTimestamp(),
            });
            console.warn(`[webhook] commission ghi nhận order ${orderCode} ref=${data.referralCode} amount=${amount} commission=${commissionAmount}`);

            // ── Gửi email thông báo cho affiliate ─────────────────────────
            try {
              const affDoc = await db.collection('affiliates').doc(data.referralCode).get();
              const affData = affDoc.exists ? affDoc.data() : null;
              const affEmail = affData?.email;
              const affName  = (affData?.name || data.referralCode).split(' ').pop();

              if (affEmail && affEmail !== 'null') {
                const customerName = data.customerName || data.payload?.HOTEN || 'Khách hàng';
                const amtFmt = amount.toLocaleString('vi-VN');
                const commFmt = commissionAmount.toLocaleString('vi-VN');
                const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

                const html = `<!DOCTYPE html>
<html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:520px;margin:32px auto;background:#1e293b;border-radius:16px;overflow:hidden;">
  <div style="background:linear-gradient(135deg,#1e3a5f,#243b55);padding:32px 28px;text-align:center;">
    <div style="font-size:11px;font-weight:800;letter-spacing:3px;color:#E8A838;margin-bottom:10px;">NCN ACADEMY</div>
    <div style="font-size:40px;margin-bottom:8px;">🎉</div>
    <h1 style="color:#fff;font-size:22px;font-weight:900;margin:0;">Bạn vừa có đơn mới!</h1>
  </div>
  <div style="padding:28px;">
    <p style="font-size:15px;color:#e2e8f0;margin:0 0 20px;">Xin chào <strong>${affName}</strong>,</p>
    <p style="font-size:14px;color:rgba(255,255,255,0.6);margin:0 0 20px;line-height:1.6;">
      Một khách hàng đã mua báo cáo qua link affiliate của bạn.
    </p>
    <div style="background:#0f172a;border-radius:12px;padding:20px;margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
        <span style="font-size:13px;color:rgba(255,255,255,0.4);">Khách hàng</span>
        <span style="font-size:13px;color:#fff;font-weight:600;">${customerName}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
        <span style="font-size:13px;color:rgba(255,255,255,0.4);">Giá trị đơn</span>
        <span style="font-size:13px;color:#fff;font-weight:600;">${amtFmt}đ</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
        <span style="font-size:13px;color:rgba(255,255,255,0.4);">Mã đơn</span>
        <span style="font-size:13px;color:#fff;font-weight:600;">#${orderCode}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
        <span style="font-size:13px;color:rgba(255,255,255,0.4);">Thời gian</span>
        <span style="font-size:13px;color:#fff;font-weight:600;">${now}</span>
      </div>
      <div style="border-top:1px solid rgba(255,255,255,0.08);margin-top:14px;padding-top:14px;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:14px;color:#E8A838;font-weight:700;">💰 Hoa hồng của bạn</span>
        <span style="font-size:24px;color:#10b981;font-weight:900;">${commFmt}đ</span>
      </div>
    </div>
    <div style="text-align:center;margin-bottom:20px;">
      <a href="https://nghechonnguoi.com/thanh-tich-affiliate"
         style="display:inline-block;background:linear-gradient(135deg,#E8A838,#f0c060);color:#1B2A4A;
                font-size:14px;font-weight:800;padding:14px 28px;border-radius:10px;text-decoration:none;">
        Xem toàn bộ thành tích →
      </a>
    </div>
    <p style="font-size:12px;color:rgba(255,255,255,0.3);text-align:center;margin:0;">
      Mã affiliate: <strong style="color:rgba(255,255,255,0.5);">${data.referralCode}</strong>
    </p>
  </div>
</div>
</body></html>`;

                const resendKey = process.env.RESEND_API_KEY;
                if (resendKey) {
                  await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      from: 'Nghề Chọn Người <no-reply@nghechonnguoi.com>',
                      to: [affEmail],
                      subject: `🎉 Bạn vừa nhận ${commFmt}đ hoa hồng — Đơn #${orderCode}`,
                      html,
                      reply_to: 'tuvanhuongnghiepchonnghe@gmail.com',
                    }),
                  });
                  console.warn(`[webhook] affiliate notification sent to ${affEmail} (ref=${data.referralCode}, commission=${commFmt})`);
                }
              }
            } catch (emailErr: any) {
              // Không block nếu email lỗi
              console.error(`[webhook] affiliate email error for ${data.referralCode}:`, emailErr.message);
            }
            // ──────────────────────────────────────────────────────────────
          }).catch(err => {
            console.error(`[webhook] commission write error for order ${orderCode}:`, err.message);
          })
        );
      }
      // ───────────────────────────────────────────────────────────────────────


      // Sync purchase status to the matching lead/customer (if one exists) so the
      // nurture sequence (onLeadCreated / dailyNurtureSend) reacts to this purchase.
      const buyerEmail = data.payload?.EMAIL;
      if (buyerEmail && buyerEmail !== 'Không cung cấp') {
        const isCoursePurchase = String(data.productType || data.payload?.PRODUCT_TYPE || 'pdf').toLowerCase() === 'course';

        // ── Update `leads` collection (quiz funnel nurture sequence) ────────
        const leadsSnap = await db.collection('leads').where('email', '==', buyerEmail).limit(1).get();
        if (!leadsSnap.empty) {
          const leadRef = leadsSnap.docs[0].ref;
          if (isCoursePurchase) {
            await leadRef.update({
              'purchases.coursePurchased': true,
              'purchases.coursePurchasedAt': FieldValue.serverTimestamp(),
              'emailSequence.unsubscribed': true,
            });
          } else {
            // PDF purchase → stop nurture, chuyển sang post-purchase sequence
            await leadRef.update({
              'purchases.pdfPurchased': true,
              'purchases.pdfPurchasedAt': FieldValue.serverTimestamp(),
              'emailSequence.currentStep': 0,
              'emailSequence.sequenceType': 'post_purchase',
              'emailSequence.nextSendAt': FieldValue.serverTimestamp(),
              'emailSequence.unsubscribed': false,
            });
          }
          console.warn(`Updated lead ${leadRef.id} purchases for order ${orderCode} (course=${isCoursePurchase})`);
        } else {
          console.warn(`No lead found for email ${buyerEmail}, skipping leads emailSequence update.`);
        }

        // ── Update `customers` collection (account holder sequence) ─────────
        const customersSnap = await db.collection('customers').where('email', '==', buyerEmail).limit(1).get();
        if (!customersSnap.empty) {
          const customerRef = customersSnap.docs[0].ref;
          if (isCoursePurchase) {
            await customerRef.update({
              'purchases.coursePurchased': true,
              'purchases.coursePurchasedAt': FieldValue.serverTimestamp(),
              'emailSequence.unsubscribed': true,
            });
          } else {
            await customerRef.update({
              'purchases.pdfPurchased': true,
              'purchases.pdfPurchasedAt': FieldValue.serverTimestamp(),
              'emailSequence.currentStep': 0,
              'emailSequence.sequenceType': 'post_purchase',
              'emailSequence.nextSendAt': FieldValue.serverTimestamp(),
              'emailSequence.unsubscribed': false,
            });
          }
          console.warn(`Updated customer ${customerRef.id} purchases for order ${orderCode} (course=${isCoursePurchase})`);
        }
      }

      // Trigger generate-pdf ngay sau khi mark PAID dùng waitUntil
      // waitUntil giữ function sống sau khi webhook đã trả response về SePay
      const orderPayload = data.payload ?? {};
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.nghechonnguoi.com';
      waitUntil(
        fetch(`${appUrl}/api/generate-pdf`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...orderPayload, orderCode: Number(orderCode) }),
        }).then(r => {
          console.warn(`[webhook] generate-pdf done for order ${orderCode}: HTTP ${r.status}`);
        }).catch(err => {
          console.error(`[webhook] generate-pdf error for order ${orderCode}:`, err.message);
        })
      );

    } else {
      console.error("Cannot update Firestore because Firebase Admin is not initialized.");
    }
    
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Lỗi webhook SePay:', error);
    return NextResponse.json({ error: error.message || 'Lỗi server' }, { status: 500, headers: corsHeaders });
  }
}
