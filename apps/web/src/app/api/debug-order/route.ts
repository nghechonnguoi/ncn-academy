// @ts-nocheck
import { NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

function initFirebase() {
  if (!getApps().length && process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      initializeApp({ credential: cert(sa) });
    } catch {}
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const orderCode = url.searchParams.get('orderCode');

  if (!orderCode) {
    return NextResponse.json({ error: 'Missing orderCode param' }, { status: 400 });
  }

  initFirebase();

  if (!getApps().length) {
    return NextResponse.json({ error: 'Firebase not configured' }, { status: 500 });
  }

  try {
    const db = getFirestore();
    const snap = await db.collection('orders').doc(orderCode).get();

    if (!snap.exists) {
      return NextResponse.json({ error: `Order ${orderCode} not found in Firestore` }, { status: 404 });
    }

    const data = snap.data();

    // Trả về toàn bộ data trừ pdfBase64 (quá lớn)
    const { pdfBase64, aiTextsCache, ...safeData } = data;

    return NextResponse.json({
      orderCode,
      ...safeData,
      hasPdfBase64: !!pdfBase64,
      hasAiTextsCache: !!aiTextsCache,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
