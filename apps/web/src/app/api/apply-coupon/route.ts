import { NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Fallback hardcode phòng khi Firestore unavailable
const FALLBACK_COUPONS: Record<string, { isAdmin: boolean; discountAmount: number }> = {
  'NADMIN':     { isAdmin: true,  discountAmount: 0 },
  'VIP-XUGUC':  { isAdmin: false, discountAmount: 0 }, 'VIP-VV4XY':  { isAdmin: false, discountAmount: 0 }, 'VIP-3J6PC':  { isAdmin: false, discountAmount: 0 },
  'VIP-YITXC':  { isAdmin: false, discountAmount: 0 }, 'VIP-DEICS':  { isAdmin: false, discountAmount: 0 }, 'VIP-GPLKX':  { isAdmin: false, discountAmount: 0 },
  'VIP-ZNTKT':  { isAdmin: false, discountAmount: 0 }, 'VIP-BAILZ':  { isAdmin: false, discountAmount: 0 }, 'VIP-FTSSX':  { isAdmin: false, discountAmount: 0 },
  'FREE-0MKTG': { isAdmin: false, discountAmount: 0 }, 'FREE-7PSNP': { isAdmin: false, discountAmount: 0 }, 'FREE-AZY5F': { isAdmin: false, discountAmount: 0 },
  'FREE-NXKYM': { isAdmin: false, discountAmount: 0 }, 'FREE-I3JHW': { isAdmin: false, discountAmount: 0 }, 'FREE-QZRGO': { isAdmin: false, discountAmount: 0 },
  'FREE-XVZZB': { isAdmin: false, discountAmount: 0 }, 'FREE-YJUZT': { isAdmin: false, discountAmount: 0 }, 'FREE-YGOSU': { isAdmin: false, discountAmount: 0 },
  'FREE-8VHYF': { isAdmin: false, discountAmount: 0 }, 'FREE-6NIAN': { isAdmin: false, discountAmount: 0 }, 'FREE-M8O9E': { isAdmin: false, discountAmount: 0 },
  'NCN-7YJVL':  { isAdmin: false, discountAmount: 0 }, 'NCN-LPB5S':  { isAdmin: false, discountAmount: 0 }, 'NCN-WH8FL':  { isAdmin: false, discountAmount: 0 },
  'NCN-FLPN9':  { isAdmin: false, discountAmount: 0 }, 'NCN-XZERO':  { isAdmin: false, discountAmount: 0 }, 'NCN-5YBOG':  { isAdmin: false, discountAmount: 0 },
  'NCN-S5QWH':  { isAdmin: false, discountAmount: 0 },
  'PRO-8RHYW':  { isAdmin: false, discountAmount: 0 }, 'PRO-OKIEY':  { isAdmin: false, discountAmount: 0 }, 'PRO-4JZMK':  { isAdmin: false, discountAmount: 0 },
  'PRO-GYHSV':  { isAdmin: false, discountAmount: 0 }, 'PRO-IQSYO':  { isAdmin: false, discountAmount: 0 }, 'PRO-KVYW8':  { isAdmin: false, discountAmount: 0 },
  'PRO-SYBGI':  { isAdmin: false, discountAmount: 0 }, 'PRO-SYX4J':  { isAdmin: false, discountAmount: 0 }, 'PRO-1CX8A':  { isAdmin: false, discountAmount: 0 },
  'GIFT-WNQ2J': { isAdmin: false, discountAmount: 0 }, 'GIFT-XQGIZ': { isAdmin: false, discountAmount: 0 }, 'GIFT-FBRXE': { isAdmin: false, discountAmount: 0 },
  'GIFT-UX8A5': { isAdmin: false, discountAmount: 0 }, 'GIFT-YQE2F': { isAdmin: false, discountAmount: 0 }, 'GIFT-5YFCK': { isAdmin: false, discountAmount: 0 },
  'GIFT-R0IEO': { isAdmin: false, discountAmount: 0 }, 'GIFT-9FNGT': { isAdmin: false, discountAmount: 0 }, 'GIFT-URNVD': { isAdmin: false, discountAmount: 0 },
  'GIFT-QESSI': { isAdmin: false, discountAmount: 0 }, 'GIFT-8X3QG': { isAdmin: false, discountAmount: 0 }, 'GIFT-IVSTS': { isAdmin: false, discountAmount: 0 },
  'GIFT-UA5XB': { isAdmin: false, discountAmount: 0 },
};

function initFirebase() {
  if (!getApps().length) {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) throw new Error('SERVER_CONFIG');
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
    initializeApp({ credential: cert(serviceAccount) });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    initFirebase();
  } catch (error: any) {
    const msg = error.message === 'SERVER_CONFIG' ? 'Server config error' : 'Server init error';
    return NextResponse.json({ success: false, message: msg }, { status: 500, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const couponCode = (body.coupon || '').toUpperCase().trim();
    const action: 'validate' | 'apply' = body.action === 'apply' ? 'apply' : 'validate';
    const orderCode  = body.orderCode || '';

    if (!couponCode) {
      return NextResponse.json({ success: false, message: 'Vui lòng nhập mã giảm giá' }, { headers: corsHeaders });
    }

    const db = getFirestore();

    // ── Kiểm tra mã có tồn tại trong Firestore `coupons` không ───────────────
    let isAdminCode  = false;
    let couponActive = false;
    let discountAmount = 0; // 0 = miễn phí hoàn toàn, >0 = giảm theo số tiền cụ thể

    const couponDoc = await db.collection('coupons').doc(couponCode).get().catch(() => null);

    if (couponDoc && couponDoc.exists) {
      const couponData = couponDoc.data()!;
      isAdminCode    = couponData.isAdmin    === true;
      couponActive   = couponData.active     !== false;
      discountAmount = Number(couponData.discountAmount ?? 0);
    } else {
      // Fallback về hardcode
      const fallback = FALLBACK_COUPONS[couponCode];
      if (!fallback) {
        return NextResponse.json({ success: false, message: 'Mã giảm giá không tồn tại' }, { headers: corsHeaders });
      }
      isAdminCode    = fallback.isAdmin;
      couponActive   = true;
      discountAmount = fallback.discountAmount;
    }

    if (!couponActive) {
      return NextResponse.json({ success: false, message: 'Mã giảm giá này không còn hiệu lực' }, { headers: corsHeaders });
    }

    const couponRef = db.collection('used_coupons').doc(couponCode);

    // ── VALIDATE: chỉ đọc, không ghi ──────────────────────────────────────────────────
    if (action === 'validate') {
      if (!isAdminCode) {
        const doc = await couponRef.get();
        if (doc.exists && doc.data()?.used) {
          const existingOrderCode = String(doc.data()?.orderCode ?? '');
          if (orderCode && existingOrderCode === String(orderCode)) {
            // Retry hợp lệ: trả về cả discountAmount
            return NextResponse.json({ success: true, message: 'Mã hợp lệ!', discountAmount }, { headers: corsHeaders });
          }
          return NextResponse.json({ success: false, message: 'Mã giảm giá này đã được sủ dụng' }, { headers: corsHeaders });
        }
      }
      return NextResponse.json({ success: true, message: 'Mã hợp lệ!', discountAmount }, { headers: corsHeaders });
    }

    // ── APPLY: mark USED + cập nhật order ───────────────────────────────────
    if (!orderCode) {
      return NextResponse.json({ success: false, message: 'Thiếu mã đơn hàng (orderCode)' }, { headers: corsHeaders });
    }

    await db.runTransaction(async (t) => {
      const doc = await t.get(couponRef);
      if (!isAdminCode && doc.exists && doc.data()?.used) {
        const existingOrderCode = String(doc.data()?.orderCode ?? '');
        if (existingOrderCode !== String(orderCode)) throw new Error('USED');
        // Cùng orderCode: idempotent — chỉ đảm bảo order được set đúng
        const orderRef = db.collection('orders').doc(String(orderCode));
        const isPaid   = discountAmount === 0; // chỉ mark PAID nếu miễn phí hoàn toàn
        t.set(orderRef, {
          ...(isPaid ? { status: 'PAID', paidAmount: 0, pdfGenerating: true } : {}),
          couponApplied: couponCode, discountAmount,
        }, { merge: true });
        return true;
      }

      if (!isAdminCode) {
        t.set(couponRef, { used: true, orderCode, usedAt: FieldValue.serverTimestamp() });
      }

      const orderRef = db.collection('orders').doc(String(orderCode));
      const isPaid   = discountAmount === 0;
      t.set(orderRef, {
        ...(isPaid ? { status: 'PAID', paidAmount: 0, paidAt: FieldValue.serverTimestamp(), pdfGenerating: true } : {}),
        couponApplied: couponCode, discountAmount,
      }, { merge: true });

      return true;
    });

    return NextResponse.json({ success: true, message: 'Áp dụng mã thành công!' }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('Lỗi apply-coupon:', error);
    if (error.message === 'USED') {
      return NextResponse.json({ success: false, message: 'Mã giảm giá này đã được sử dụng' }, { headers: corsHeaders });
    }
    return NextResponse.json({ success: false, message: error.message || 'Lỗi server' }, { status: 500, headers: corsHeaders });
  }
}
