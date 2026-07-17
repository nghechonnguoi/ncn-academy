import { NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function initFirebase() {
  if (!getApps().length && process.env.FIREBASE_SERVICE_ACCOUNT) {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
    initializeApp({ credential: cert(sa) });
  }
  return getFirestore();
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req: Request) { return handler(req); }
export async function POST(req: Request) { return handler(req); }

async function handler(req: Request) {
  try {
    const db = initFirebase();
    const url = new URL(req.url);
    let orderCode = url.searchParams.get('orderCode');
    const payloadOnly = url.searchParams.get('payload') === 'true';

    if (req.method === 'POST') {
      try { const body = await req.json(); orderCode = orderCode || body.orderCode; } catch {}
    }

    // List recent orders nếu không có orderCode
    if (!orderCode) {
      const snap = await db.collection('orders')
        .where('status', 'in', ['PAID', 'PARTIAL_PAID', 'PENDING'])
        .orderBy('createdAt', 'desc').limit(20).get();
      const orders = snap.docs.map(d => ({
        id: d.id,
        status: d.data().status,
        email: d.data().customerEmail || d.data().payload?.EMAIL || '—',
        amount: d.data().amount,
        pdfDone: d.data().pdfDone,
        pdfGenerating: d.data().pdfGenerating,
        createdAt: d.data().createdAt?.toDate?.()?.toISOString() ?? null,
      }));
      return NextResponse.json({ orders }, { headers: corsHeaders });
    }

    // Lấy order
    const docRef = db.collection('orders').doc(String(orderCode));
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return NextResponse.json({ error: `Order ${orderCode} not found` }, { status: 404, headers: corsHeaders });
    }

    const data = docSnap.data()!;
    const payload = data.payload;

    if (!payload || Object.keys(payload).length === 0) {
      return NextResponse.json({
        error: 'Order found but no payload stored.',
        order: { status: data.status, email: data.customerEmail }
      }, { status: 400, headers: corsHeaders });
    }

    // ?payload=true → chỉ trả về payload, không gọi generate-pdf
    if (payloadOnly) {
      return NextResponse.json({
        orderCode, status: data.status,
        email: data.customerEmail || payload?.EMAIL,
        payload,
      }, { headers: corsHeaders });
    }

    // Gọi generate-pdf trực tiếp (có thể timeout)
    const origin = new URL(req.url).origin;
    const pdfRes = await fetch(`${origin}/api/generate-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const pdfData = await pdfRes.json().catch(() => ({}));

    return NextResponse.json({
      success: pdfRes.ok, orderCode,
      status: data.status,
      email: data.customerEmail || payload?.EMAIL,
      pdfResponse: pdfData,
    }, { headers: corsHeaders });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
