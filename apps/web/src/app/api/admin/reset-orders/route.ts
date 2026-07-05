import { NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    if (!getApps().length) {
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
        initializeApp({
          credential: cert(serviceAccount)
        });
      }
    }

    if (!getApps().length) {
      return NextResponse.json({ success: false, error: 'Firebase is not initialized' });
    }

    const db = getFirestore();
    const ordersSnap = await db.collection('orders').get();
    
    let resetCount = 0;
    const batch = db.batch();
    
    ordersSnap.forEach((doc) => {
      batch.update(doc.ref, {
        pdfDone: false,
        pdfGenerating: false,
        aiTextsCache: null,
        aiGenerationFailed: false,
        aiErrorDetail: null
      });
      resetCount++;
    });

    await batch.commit();

    return NextResponse.json({ success: true, message: `Reset ${resetCount} orders successfully.` });
  } catch (error: any) {
    console.error("Reset error:", error);
    return NextResponse.json({ success: false, error: error.message });
  }
}
