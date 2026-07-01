import { NextResponse } from 'next/server';
const { PayOS } = require('@payos/node');
import * as admin from 'firebase-admin';


export async function POST(req: Request) {
  // Initialize Firebase Admin if not already initialized
  // @ts-ignore
  if (!admin.apps?.length) {
    try {
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
        // @ts-ignore
        admin.initializeApp({
          // @ts-ignore
          credential: admin.credential.cert(serviceAccount)
        });
      } else {
        console.warn("Missing FIREBASE_SERVICE_ACCOUNT environment variable. Firestore updates via webhook will fail.");
      }
    } catch (error) {
      console.error("Firebase admin init error:", error);
    }
  }
  // @ts-ignore
  // @ts-ignore
  const payos = new PayOS({
    clientId: process.env.PAYOS_CLIENT_ID || 'dummy_client_id',
    apiKey: process.env.PAYOS_API_KEY || 'dummy_api_key',
    checksumKey: process.env.PAYOS_CHECKSUM_KEY || 'dummy_checksum_key'
  });

  try {
    const body = await req.json();
    console.log("PayOS Webhook received:", body);
    
    const webhookData = await payos.webhooks.verify(body);
    
    // webhookData returns data object
    if (webhookData && webhookData.orderCode) {
      // Payment successful
      const orderCode = String(webhookData.orderCode);
      
      // Update Firestore
      // @ts-ignore
      if (admin.apps.length) {
        // @ts-ignore
        const db = admin.firestore();
        await db.collection('orders').doc(orderCode).set({
          status: 'PAID',
          amount: webhookData.amount,
          // @ts-ignore
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
