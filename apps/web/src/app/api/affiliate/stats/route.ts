/**
 * GET /api/affiliate/stats
 * Trả về thống kê affiliate của user hiện tại — đọc từ Firestore.
 * Thay thế NestJS /api/v1/affiliate/stats (không reachable từ Vercel production).
 *
 * Header: Authorization: Bearer <accessToken>
 */
import { NextResponse } from 'next/server';
import { getDb, verifyToken, authCorsHeaders } from '@/lib/auth-firebase';
import { getTierByOrderCount } from '@/lib/affiliateTiers';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return NextResponse.json({}, { headers: authCorsHeaders });
}

export async function GET(req: Request) {
  try {
    // ── Xác thực token ──────────────────────────────────────────
    const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
    if (!token) {
      return NextResponse.json({ message: 'Chưa đăng nhập' }, { status: 401, headers: authCorsHeaders });
    }
    const payload = await verifyToken(token);
    if (!payload || payload.type !== 'access') {
      return NextResponse.json({ message: 'Token không hợp lệ' }, { status: 401, headers: authCorsHeaders });
    }

    const db = getDb();

    // ── Đọc user để lấy affiliateCode ──────────────────────────
    const userDoc = await db.collection('users').doc(payload.sub).get();
    if (!userDoc.exists) {
      return NextResponse.json({ message: 'User không tồn tại' }, { status: 404, headers: authCorsHeaders });
    }
    const userData = userDoc.data()!;
    const affiliateCode: string = userData.affiliateCode || '';

    if (!affiliateCode) {
      return NextResponse.json({
        affiliateCode: null,
        referralLink: null,
        totalPaid: 0,
        pendingAmount: 0,
        totalReferrals: 0,
        tierName: 'Thành viên',
        commissionRate: 0.20,
        lifetimeOrders: 0,
      }, { headers: authCorsHeaders });
    }

    // ── Đọc toàn bộ orders PAID có referralCode này ─────────────
    // (Firestore không có composite index nên lọc ở JS)
    const ordersSnap = await db.collection('orders')
      .where('status', '==', 'PAID')
      .where('referralCode', '==', affiliateCode)
      .get();

    const lifetimeOrders = ordersSnap.size;
    const tier = getTierByOrderCount(lifetimeOrders);

    // ── Đọc commissions từ affiliate_commissions ─────────────────
    const commissionsSnap = await db.collection('affiliate_commissions')
      .where('referralCode', '==', affiliateCode)
      .get();

    let totalPaid    = 0;
    let pendingAmount = 0;

    commissionsSnap.forEach(doc => {
      const d = doc.data();
      const amt = Number(d.commissionAmount ?? 0);
      if (d.status === 'PAID') totalPaid    += amt;
      else                     pendingAmount += amt;
    });

    return NextResponse.json({
      affiliateCode,
      referralLink:   `https://quiz.nghechonnguoi.com/?ref=${affiliateCode}`,
      totalPaid,
      pendingAmount,
      totalReferrals: lifetimeOrders,  // mỗi order = 1 lượt giới thiệu thành công
      tierName:       tier.name,
      commissionRate: tier.commissionRate,
      lifetimeOrders,
    }, { headers: authCorsHeaders });

  } catch (err: any) {
    console.error('[affiliate/stats] error:', err);
    return NextResponse.json({ message: err.message }, { status: 500, headers: authCorsHeaders });
  }
}
