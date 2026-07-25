import { NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BOOTSTRAP_SECRET = process.env.BOOTSTRAP_SECRET ?? 'ncn-bootstrap-2026';

function initFirebase() {
  if (!getApps().length) {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
    initializeApp({ credential: cert(sa) });
  }
}

/**
 * POST /api/admin/backfill-affiliate
 * Body: { "secret": "ncn-bootstrap-2026", "date": "2026-07-25" }  ← date tuỳ chọn, mặc định hôm nay
 *
 * Query tất cả orders PAID có referralCode trong ngày chỉ định,
 * gọi /affiliate/internal/sepay-sync cho từng order để đảm bảo commission được ghi.
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

    // Xác định khoảng thời gian cần backfill
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay   = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`[backfill-affiliate] Scanning orders from ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

    // Query orders PAID có referralCode trong ngày (dùng createdAt filter)
    const snap = await db.collection('orders')
      .where('status', '==', 'PAID')
      .where('createdAt', '>=', startOfDay)
      .where('createdAt', '<=', endOfDay)
      .get();

    const apiUrl         = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const internalSecret = process.env.INTERNAL_API_SECRET || 'ncn-internal-secret-2026';

    let synced  = 0;
    let skipped = 0;
    let errors  = 0;
    const results: any[] = [];

    for (const doc of snap.docs) {
      const data = doc.data();
      const oc   = doc.id;

      // Bỏ qua order không có affiliate
      if (!data.referralCode) {
        skipped++;
        continue;
      }

      try {
        const res = await fetch(`${apiUrl}/api/v1/affiliate/internal/sepay-sync`, {
          method:  'POST',
          headers: {
            'Content-Type':      'application/json',
            'x-internal-secret': internalSecret,
          },
          body: JSON.stringify({
            referralCode:  data.referralCode,
            amount:        Number(data.paidAmount ?? data.amount ?? 0),
            customerEmail: data.customerEmail || data.payload?.EMAIL || '',
            customerName:  data.customerName  || data.payload?.HOTEN || '',
            orderCode:     String(oc),
          }),
        });

        const resJson = await res.json().catch(() => ({}));
        console.log(`[backfill-affiliate] order ${oc} ref=${data.referralCode}: HTTP ${res.status}`, resJson);

        results.push({
          orderCode:    oc,
          referralCode: data.referralCode,
          amount:       data.paidAmount ?? data.amount ?? 0,
          status:       res.status,
          message:      resJson.message ?? '',
        });
        synced++;
      } catch (err: any) {
        console.error(`[backfill-affiliate] error order ${oc}:`, err.message);
        results.push({ orderCode: oc, referralCode: data.referralCode, error: err.message });
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      date:    targetDate.toISOString().split('T')[0],
      total:   snap.size,
      synced,
      skipped,
      errors,
      results,
    });

  } catch (err: any) {
    console.error('[backfill-affiliate] fatal:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
