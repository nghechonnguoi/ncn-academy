import { NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

function initFirebase() {
  if (!getApps().length && process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      initializeApp({ credential: cert(serviceAccount) });
    } catch {}
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const orderCode = url.searchParams.get('orderCode');

  if (!orderCode) {
    return NextResponse.json({ error: 'Missing orderCode' }, { status: 400 });
  }

  initFirebase();

  if (!getApps().length) {
    return NextResponse.json({ status: 'PENDING', error: 'Firebase not configured' });
  }

  try {
    const db = getFirestore();
    const snap = await db.collection('orders').doc(orderCode).get();

    if (!snap.exists) {
      return NextResponse.json({ status: 'NOT_FOUND' });
    }

    const data = snap.data()!;
    return NextResponse.json({
      status:        data.status     ?? 'PENDING',
      pdfGenerating: data.pdfGenerating ?? false,
      pdfDone:       data.pdfDone    ?? false,
      pdfBase64:     data.pdfBase64  ?? null,
    });
  } catch (err: any) {
    return NextResponse.json({ status: 'ERROR', error: err.message }, { status: 500 });
  }
}
