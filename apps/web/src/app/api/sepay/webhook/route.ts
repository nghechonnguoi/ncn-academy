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
      const PRICE_FULL      = 799_000;
      const PRICE_AFFILIATE = 759_000;

      const expectedAmount = Number(data.amount || 0);
      // Chấp nhận trong biên độ 1.000đ để xử lý làm tròn của ngân hàng
      const ROUNDING_BUFFER = 1_000;
      const minimumAccept   = expectedAmount - ROUNDING_BUFFER;
      const hasAffiliate    = !!data.referralCode;

      console.warn(
        `[webhook] order ${orderCode}` +
        ` | mốc: ${expectedAmount === PRICE_AFFILIATE ? 'AFFILIATE (759k)' : expectedAmount === PRICE_FULL ? 'FULL (799k)' : `CUSTOM (${expectedAmount}đ)`}` +
        ` | received: ${amount.toLocaleString('vi-VN')}đ` +
        ` | min acceptable: ${minimumAccept.toLocaleString('vi-VN')}đ` +
        (hasAffiliate ? ` | ref: ${data.referralCode}` : '')
      );

      if (amount < minimumAccept) {
        console.warn(
          `[webhook] ❌ PARTIAL_PAID order ${orderCode}:` +
          ` received ${amount.toLocaleString('vi-VN')}đ` +
          ` < min ${minimumAccept.toLocaleString('vi-VN')}đ` +
          ` (expected ${expectedAmount.toLocaleString('vi-VN')}đ)`
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
      // (NestJS API không reachable từ Vercel — dùng Firestore làm nguồn duy nhất)
      if (data.referralCode) {
        const commissionId  = `sepay-${String(orderCode)}`;
        const commissionRef = db.collection('affiliate_commissions').doc(commissionId);
        waitUntil(
          commissionRef.get().then(async (existing) => {
            if (existing.exists) {
              console.warn(`[webhook] commission ${commissionId} already exists, skipping`);
              return;
            }
            await commissionRef.set({
              referralCode:     data.referralCode,
              orderCode:        String(orderCode),
              amount:           amount,
              commissionAmount: Math.round(amount * 0.20),
              commissionRate:   0.20,
              customerEmail:    data.customerEmail || data.payload?.EMAIL || '',
              customerName:     data.customerName  || data.payload?.HOTEN || '',
              status:           'PENDING',
              source:           'sepay_webhook',
              createdAt:        FieldValue.serverTimestamp(),
            });
            console.warn(`[webhook] commission ghi nhận order ${orderCode} ref=${data.referralCode} amount=${amount} commission=${Math.round(amount * 0.20)}`);
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
