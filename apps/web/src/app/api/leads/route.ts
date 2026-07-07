import { NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export async function POST(req: Request) {
  if (!getApps().length) {
    try {
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
        initializeApp({
          credential: cert(serviceAccount)
        });
      } else {
        console.warn("Missing FIREBASE_SERVICE_ACCOUNT environment variable. Lead capture will fail.");
      }
    } catch (error) {
      console.error("Firebase admin init error:", error);
    }
  }

  try {
    const { email, name, hollandCode } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, message: 'Missing email' }, { status: 400 });
    }
    if (!getApps().length) {
      return NextResponse.json({ success: false, message: 'Firestore not configured' }, { status: 503 });
    }

    const db = getFirestore();
    const existing = await db.collection('leads').where('email', '==', email).limit(1).get();

    if (!existing.empty) {
      // Lead already exists — just refresh their quiz result, don't touch the
      // nurture sequence state (onLeadCreated already ran once for this lead).
      await existing.docs[0].ref.update({
        name: name || existing.docs[0].data().name || '',
        quizResult: { hollandCode: hollandCode || null },
      });
      return NextResponse.json({ success: true, created: false });
    }

    // New lead — this triggers onLeadCreated (welcome nurture email).
    await db.collection('leads').add({
      email,
      name: name || '',
      quizResult: { hollandCode: hollandCode || null },
      purchases: { pdfPurchased: false, coursePurchased: false },
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, created: true });
  } catch (error: any) {
    console.error('Failed to create/update lead:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
