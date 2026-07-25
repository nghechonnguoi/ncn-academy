import { NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const BOOTSTRAP_SECRET = process.env.BOOTSTRAP_SECRET ?? 'ncn-bootstrap-2026';

function initFirebase() {
  if (!getApps().length) {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
    initializeApp({ credential: cert(sa) });
  }
}

/**
 * POST /api/admin/orders-today
 * Body: { "secret": "ncn-bootstrap-2026", "date": "2026-07-25" }
 *
 * Trả về danh sách tất cả orders PAID trong ngày kèm thông tin affiliate.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { secret, date } = body;

    if (!secret || secret !== BOOTSTRAP_SECRET) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    initFirebase();
    const db = getFirestore();

    const targetDate = date ? new Date(date) : new Date();
    // Dùng UTC+7 (Việt Nam) để tính start/end of day
    const dateStr    = date || targetDate.toISOString().split('T')[0];
    const startOfDay = new Date(`${dateStr}T00:00:00+07:00`);
    const endOfDay   = new Date(`${dateStr}T23:59:59+07:00`);

    // Lấy tất cả orders PAID, lọc ngày trong JS
    const snap = await db.collection('orders').where('status', '==', 'PAID').get();

    const todayOrders = snap.docs
      .filter(doc => {
        const createdAt = doc.data().createdAt?.toDate?.() ?? null;
        return createdAt && createdAt >= startOfDay && createdAt <= endOfDay;
      })
      .map(doc => {
        const d = doc.data();
        return {
          orderCode:     doc.id,
          customerName:  d.customerName  || d.payload?.HOTEN   || '—',
          customerEmail: d.customerEmail || d.payload?.EMAIL   || '—',
          amount:        d.paidAmount    ?? d.amount           ?? 0,
          referralCode:  d.referralCode  || null,
          couponApplied: d.couponApplied || null,
          paidAt:        d.paidAt?.toDate?.()?.toISOString()   || null,
          createdAt:     d.createdAt?.toDate?.()?.toISOString() || null,
          pdfDone:       d.pdfDone       ?? false,
        };
      })
      .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));

    // Thống kê nhanh
    const withAffiliate    = todayOrders.filter(o => o.referralCode);
    const withoutAffiliate = todayOrders.filter(o => !o.referralCode);
    const totalRevenue     = todayOrders.reduce((s, o) => s + o.amount, 0);

    return NextResponse.json({
      success: true,
      date:    dateStr,
      stats: {
        total:          todayOrders.length,
        withAffiliate:  withAffiliate.length,
        withoutAffiliate: withoutAffiliate.length,
        totalRevenue,
      },
      affiliateCodes: [...new Set(withAffiliate.map(o => o.referralCode))],
      orders: todayOrders,
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
