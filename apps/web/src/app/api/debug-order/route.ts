import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    if (!admin.apps?.length) {
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
      }
    }
    const db = admin.firestore();
    const docRef = db.collection('orders').doc('516');
    const docSnap = await docRef.get();
    
    return NextResponse.json({
      projectId: admin.app().options.projectId,
      exists: docSnap.exists,
      data: docSnap.exists ? docSnap.data() : null
    });
  } catch (error) {
    return NextResponse.json({ error: error.message });
  }
}
