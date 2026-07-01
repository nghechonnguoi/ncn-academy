import { NextResponse } from 'next/server';
import PayOS from '@payos/node';
import * as admin from 'firebase-admin';

const payos = new PayOS(
  process.env.PAYOS_CLIENT_ID || 'dummy_client_id',
  process.env.PAYOS_API_KEY || 'dummy_api_key',
  process.env.PAYOS_CHECKSUM_KEY || 'dummy_checksum_key'
);

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      console.warn("Missing FIREBASE_SERVICE_ACCOUNT environment variable. Firestore updates via webhook will fail.");
    }
  } catch (error) {
    console.error("Firebase admin init error:", error);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("PayOS Webhook received:", body);
    
    const webhookData = payos.verifyPaymentWebhookData(body);
    
    // webhookData contains orderCode, amount, description, success, etc.
    if (webhookData.code === "00") {
      // Payment successful
      const orderCode = String(webhookData.data.orderCode);
      
      // Update Firestore
      if (admin.apps.length) {
        const db = admin.firestore();
        await db.collection('orders').doc(orderCode).set({
          status: 'PAID',
          amount: webhookData.data.amount,
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        console.log(`Order ${orderCode} marked as PAID in Firestore`);
      } else {
        console.error("Cannot update Firestore because Firebase Admin is not initialized.");
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
