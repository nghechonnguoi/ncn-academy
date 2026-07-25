import { NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

const BOOTSTRAP_SECRET = process.env.BOOTSTRAP_SECRET ?? 'ncn-bootstrap-2026';

function initFirebase() {
  if (!getApps().length) {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
    initializeApp({ credential: cert(sa) });
  }
}

/**
 * POST /api/admin/manual-affiliate-sync
 * Body: {
 *   "secret": "ncn-bootstrap-2026",
 *   "referralCode": "VAN418",
 *   "orderCode": "6527",
 *   "amount": 399000,               ← tuỳ chọn, mặc định đọc từ Firestore order
 *   "customerEmail": "...",          ← tuỳ chọn
 *   "customerName": "..."            ← tuỳ chọn
 * }
 *
 * Ghi nhận commission thủ công cho một affiliate (bypass sepay flow).
 * Đọc thông tin order từ Firestore nếu thiếu, rồi gọi NestJS sepay-sync.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { secret, referralCode, orderCode, amount, customerEmail, customerName } = body;

    if (!secret || secret !== BOOTSTRAP_SECRET) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    if (!referralCode || !orderCode) {
      return NextResponse.json({ success: false, error: 'Thiếu referralCode hoặc orderCode' }, { status: 400 });
    }

    initFirebase();
    const db = getFirestore();

    // Đọc thông tin order từ Firestore (để lấy amount, email, name nếu không truyền)
    const orderSnap = await db.collection('orders').doc(String(orderCode)).get();
    const orderData = orderSnap.exists ? orderSnap.data()! : {};

    const syncPayload = {
      referralCode:  referralCode.trim().toUpperCase(),
      amount:        Number(amount ?? orderData.paidAmount ?? orderData.amount ?? 0),
      customerEmail: customerEmail || orderData.customerEmail || orderData.payload?.EMAIL || '',
      customerName:  customerName  || orderData.customerName  || orderData.payload?.HOTEN || '',
      orderCode:     String(orderCode),
    };

    console.log('[manual-affiliate-sync] payload:', syncPayload);

    // Gọi NestJS affiliate sync (internal, server-side)
    const apiUrl         = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const internalSecret = process.env.INTERNAL_API_SECRET || 'ncn-internal-secret-2026';

    const syncRes = await fetch(`${apiUrl}/api/v1/affiliate/internal/sepay-sync`, {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-internal-secret': internalSecret,
      },
      body: JSON.stringify(syncPayload),
    });

    const syncJson = await syncRes.json().catch(() => ({}));
    console.log('[manual-affiliate-sync] sync result:', syncRes.status, syncJson);

    // Cập nhật referralCode vào order document (để tracking đúng)
    if (orderSnap.exists) {
      await db.collection('orders').doc(String(orderCode)).update({
        referralCode: syncPayload.referralCode,
        referralAddedManually: true,
        referralAddedAt: new Date(),
      });
    }

    return NextResponse.json({
      success: syncRes.ok,
      syncStatus: syncRes.status,
      syncMessage: syncJson.message ?? '',
      payload: syncPayload,
      orderUpdated: orderSnap.exists,
    });

  } catch (err: any) {
    console.error('[manual-affiliate-sync] error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
