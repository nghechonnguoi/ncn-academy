/**
 * GET /api/affiliate-stats?code=KHANH783
 * 
 * Public endpoint — trả về thống kê cá nhân của một affiliate.
 * Không cần auth vì mã referral chính là "mật khẩu" của họ.
 */
import { NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getTierByOrderCount } from '@/lib/affiliateTiers';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function initFirebase() {
  if (!getApps().length) {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
    initializeApp({ credential: cert(sa) });
  }
  return getFirestore();
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = (searchParams.get('code') || '').trim().toUpperCase();

    if (!code) {
      return NextResponse.json({ success: false, error: 'Thiếu mã affiliate' }, { status: 400, headers: corsHeaders });
    }

    const db = initFirebase();

    // Kiểm tra affiliate tồn tại
    const affDoc = await db.collection('affiliates').doc(code).get();
    if (!affDoc.exists) {
      return NextResponse.json({ success: false, error: 'Mã affiliate không tồn tại' }, { status: 404, headers: corsHeaders });
    }
    const aff = affDoc.data()!;

    // Query tất cả orders của affiliate này (đã thanh toán)
    // Không dùng orderBy để tránh cần composite index — sort trong JS
    const ordersSnap = await db.collection('orders')
      .where('referralCode', '==', code)
      .limit(200)
      .get();

    // Sort theo createdAt desc trong JS
    const orderDocs = ordersSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a: any, b: any) => {
        const ta = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const tb = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return tb - ta;
      });

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd   = thisMonthStart;

    let lifetimeOrders = 0;
    let lifetimeRevenue = 0;
    let thisMonthOrders = 0;
    let thisMonthRevenue = 0;
    let lastMonthOrders = 0;
    let lastMonthRevenue = 0;

    const recentOrders: any[] = [];

    orderDocs.forEach((d: any) => {
      const isPaid = (d.paidAmount && d.paidAmount > 0) || d.status === 'PAID';
      if (!isPaid) return;

      const amt = d.paidAmount || d.amount || 0;
      const createdAt: Date = d.createdAt?.toDate ? d.createdAt.toDate() : new Date(0);


      lifetimeOrders++;
      lifetimeRevenue += amt;

      if (createdAt >= thisMonthStart) {
        thisMonthOrders++;
        thisMonthRevenue += amt;
      }
      if (createdAt >= lastMonthStart && createdAt < lastMonthEnd) {
        lastMonthOrders++;
        lastMonthRevenue += amt;
      }

      // 10 đơn gần nhất
      if (recentOrders.length < 10) {
        recentOrders.push({
          orderCode: d.orderCode,
          customerName: d.customerName ? d.customerName.split(' ').slice(-2).join(' ') : 'Ẩn danh', // chỉ họ tên để bảo mật
          amount: amt,
          date: createdAt.toISOString().split('T')[0],
        });
      }
    });

    const tier = getTierByOrderCount(lifetimeOrders);
    const thisMonthCommission = Math.round(thisMonthRevenue * tier.commissionRate);
    const lastMonthCommission = Math.round(lastMonthRevenue * tier.commissionRate);

    // Cấp bậc tiếp theo
    const tiers = [
      { name: 'Thành viên', minOrders: 0,  commissionRate: 0.20 },
      { name: 'Bạc',        minOrders: 10, commissionRate: 0.22 },
      { name: 'Vàng',       minOrders: 30, commissionRate: 0.25 },
      { name: 'Kim Cương',  minOrders: 80, commissionRate: 0.30 },
    ];
    const currentTierIdx = tiers.findIndex(t => t.name === tier.name);
    const nextTier = tiers[currentTierIdx + 1] || null;
    const ordersToNextTier = nextTier ? Math.max(0, nextTier.minOrders - lifetimeOrders) : 0;

    return NextResponse.json({
      success: true,
      affiliate: {
        name: aff.name,
        referralCode: code,
        affiliateLink: `https://quiz.nghechonnguoi.com/?ref=${code}`,
      },
      stats: {
        lifetimeOrders,
        lifetimeRevenue,
        tier: tier.name,
        commissionRate: tier.commissionRate,
        nextTier: nextTier ? { name: nextTier.name, ordersNeeded: ordersToNextTier } : null,
        thisMonth: {
          orders: thisMonthOrders,
          revenue: thisMonthRevenue,
          commission: thisMonthCommission,
        },
        lastMonth: {
          orders: lastMonthOrders,
          revenue: lastMonthRevenue,
          commission: lastMonthCommission,
        },
      },
      recentOrders,
    }, { headers: corsHeaders });

  } catch (err: any) {
    console.error('affiliate-stats error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders });
  }
}
