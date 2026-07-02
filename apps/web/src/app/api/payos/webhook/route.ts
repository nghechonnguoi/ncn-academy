import { NextResponse } from 'next/server';
const { PayOS } = require('@payos/node');
import * as admin from 'firebase-admin';


export const maxDuration = 300;

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
        const docRef = db.collection('orders').doc(orderCode);
        const docSnap = await docRef.get();
        const data = docSnap.exists ? docSnap.data() : null;

        // Bỏ qua nếu đang tạo hoặc đã tạo PDF rồi (tránh PayOS gọi lại webhook nhiều lần)
        if (data && data.pdfGenerating) {
          console.log(`Order ${orderCode} is already generating PDF. Returning early.`);
          return NextResponse.json({ success: true, message: 'Processing' });
        }

        await docRef.set({
          status: 'PAID',
          amount: webhookData.amount,
          // @ts-ignore
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
          pdfGenerating: true
        }, { merge: true });
        console.log(`Order ${orderCode} marked as PAID and PDF generating in Firestore`);

        // Tự động gọi API generate-pdf ở background nếu có payload
        if (data && data.payload) {
          console.log(`Triggering background PDF generation for order ${orderCode}`);
          try {
            // Lấy URL hiện tại để gọi API cục bộ
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ncn-academy-web.vercel.app';
            const pdfRes = await fetch(`${baseUrl}/api/generate-pdf`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...data.payload, orderCode })
            });

            if (!pdfRes.ok) {
              console.error("Background PDF API failed with status:", pdfRes.status);
              await docRef.set({ pdfGenerating: false }, { merge: true });
            } else {
              // API generate-pdf sẽ tự cập nhật pdfBase64 vào Firestore
              // Mình chỉ cập nhật tắt cờ generating
              await docRef.set({ pdfGenerating: false, pdfDone: true }, { merge: true });
            }
          } catch (err) {
            console.error("Failed to trigger background PDF API:", err);
            await docRef.set({ pdfGenerating: false }, { merge: true });
          }
        }

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
