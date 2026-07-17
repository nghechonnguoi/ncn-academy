import { NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getTierByOrderCount } from '@/lib/affiliateTiers';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        if (!getApps().length) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
            initializeApp({ credential: cert(serviceAccount) });
        }
        const db = getFirestore();

        const { searchParams } = new URL(req.url);
        const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
        const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
        const showAll = searchParams.get('showAll') === 'true';

        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 1);

        const affiliatesSnap = await db.collection('affiliates').get();

        const allPaidOrdersSnap = await db.collection('orders')
            .where('status', '==', 'PAID')
            .get();

        const lifetimeCountByCode: Record<string, number> = {};
        const monthlyOrdersByCode: Record<string, { count: number; totalAmount: number }> = {};

        allPaidOrdersSnap.forEach(doc => {
            const d = doc.data();
            const code = d.referralCode;
            if (!code) return;

            lifetimeCountByCode[code] = (lifetimeCountByCode[code] || 0) + 1;

            const createdAt = d.createdAt?.toDate ? d.createdAt.toDate() : null;
            if (createdAt && createdAt >= monthStart && createdAt < monthEnd) {
                if (!monthlyOrdersByCode[code]) monthlyOrdersByCode[code] = { count: 0, totalAmount: 0 };
                monthlyOrdersByCode[code].count += 1;
                monthlyOrdersByCode[code].totalAmount += (d.amount || 0);
            }
        });

        const report = affiliatesSnap.docs.map(doc => {
            const aff = doc.data();
            const code = aff.referralCode;
            const lifetimeOrders = lifetimeCountByCode[code] || 0;
            const tier = getTierByOrderCount(lifetimeOrders);
            const monthly = monthlyOrdersByCode[code] || { count: 0, totalAmount: 0 };
            const commissionOwed = Math.round(monthly.totalAmount * tier.commissionRate);

            return {
                referralCode: code,
                name: aff.name,
                phone: aff.phone,
                bankAccount: aff.bankAccount,
                bankName: aff.bankName,
                lifetimeOrders,
                tierName: tier.name,
                commissionRate: tier.commissionRate,
                monthOrderCount: monthly.count,
                monthRevenue: monthly.totalAmount,
                commissionOwed,
                payoutContent: `HH ${code} ${String(month).padStart(2, '0')}${year}`
            };
        });

        if (!showAll) {
            report = report.filter(r => r.monthOrderCount > 0 || r.lifetimeOrders > 0);
        }

        report.sort((a, b) => b.commissionOwed - a.commissionOwed || b.lifetimeOrders - a.lifetimeOrders);

        return NextResponse.json({ success: true, month, year, report });
    } catch (error: any) {
        console.error("Affiliate report error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}