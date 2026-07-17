import { NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function initFirebase() {
  if (!getApps().length && process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      initializeApp({ credential: cert(serviceAccount) });
    } catch {}
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  initFirebase();

  try {
    const body = await req.json();
    const {
      orderCode, orderId, amount, customerName,
      customerEmail, customerPhone, payload,
      referralCode,
    } = body;

    if (!orderCode || !amount) {
      return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400, headers: corsHeaders });
    }

    if (getApps().length) {
      const db = getFirestore();
      await db.collection('orders').doc(String(orderCode)).set({
        orderId:       orderId ?? `NCN-${orderCode}`,
        orderCode:     Number(orderCode),
        amount:        Number(amount),
        status:        'PENDING',
        customerName:  customerName  ?? '',
        customerEmail: customerEmail ?? '',
        customerPhone: customerPhone ?? '',
        payload:       payload       ?? {},
        referralCode:  referralCode  || '',   // affiliate tracking
        createdAt:     FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders });

  } catch (err: any) {
    console.error('create-order error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders });
  }
}
