import { NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req: Request) {
    try {
        if (!getApps().length) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
            initializeApp({ credential: cert(serviceAccount) });
        }
        const db = getFirestore();

        const { searchParams } = new URL(req.url);
        const phone = searchParams.get('phone');

        if (!phone) {
            return NextResponse.json({ success: false, error: 'Vui lòng nhập số điện thoại' }, { headers: corsHeaders });
        }

        const snapshot = await db.collection('affiliates').where('phone', '==', phone).get();
        if (snapshot.empty) {
            return NextResponse.json({ success: false, error: 'Không tìm thấy' }, { headers: corsHeaders });
        }

        const docData = snapshot.docs[0].data();
        return NextResponse.json({ success: true, code: docData.referralCode }, { headers: corsHeaders });
    } catch (error: any) {
        console.error("Affiliate lookup error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
    }
}
