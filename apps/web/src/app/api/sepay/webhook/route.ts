import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

export const maxDuration = 300;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

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

  try {
    const body = await req.json();
    console.log("SePay Webhook received:", body);
    
    // SePay sends the transaction details in the payload
    // Adjust based on SePay's actual webhook structure. Usually it's at root or nested under `data`.
    const payload = body.data || body;
    
    // SePay transaction content field is usually `content` or `transactionContent`
    const content = String(payload.content || payload.transactionContent || payload.description || "").toUpperCase();
    const amount = Number(payload.transferAmount || payload.amount || 0);
    
    if (!content) {
      return NextResponse.json({ success: false, message: 'No content found in webhook' }, { headers: corsHeaders });
    }

    // Try to extract order code. We expect format "NCN 12345" or similar.
    const match = content.match(/NCN\s*(\d+)/i);
    if (!match) {
      console.log(`Ignoring transaction. Content does not contain NCN [orderCode]: ${content}`);
      return NextResponse.json({ success: true, message: 'Ignored (Not NCN order)' }, { headers: corsHeaders });
    }
    
    const orderCode = match[1];
    console.log(`Extracted Order Code: ${orderCode}, Amount: ${amount}`);
    
    // Initialize Firebase Admin if not already initialized
    // @ts-ignore
    if (!admin.apps?.length) {
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        // @ts-ignore
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        // @ts-ignore
        admin.initializeApp({
          // @ts-ignore
          credential: admin.credential.cert(serviceAccount)
        });
      }
    }

    // Update Firestore
    // @ts-ignore
    if (admin.apps?.length) {
      // @ts-ignore
      console.log(`Firebase Project ID: ${admin.app().options.projectId}`);
      // @ts-ignore
      const db = admin.firestore();
      const docRef = db.collection('orders').doc(orderCode);
      const docSnap = await docRef.get();
      const data = docSnap.exists ? docSnap.data() : null;

      if (!data) {
        console.warn(`Order ${orderCode} not found in database.`);
        return NextResponse.json({ success: true, message: 'Order not found' }, { headers: corsHeaders });
      }

      // Check if amount is sufficient (you may want to skip this if you trust any amount, but it's safe to log)
      console.log(`Expected amount: (Depends on discount, we assume success if any amount is paid for now)`);

      // Skip if already generating
      if (data.pdfGenerating || data.pdfDone) {
        console.log(`Order ${orderCode} is already paid or generating PDF. Returning early.`);
        return NextResponse.json({ success: true, message: 'Already Processing' }, { headers: corsHeaders });
      }

      await docRef.set({
        status: 'PAID',
        paidAmount: amount,
        sepayData: payload,
        // @ts-ignore
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
        pdfGenerating: true
      }, { merge: true });
      
      console.log(`Order ${orderCode} marked as PAID and PDF generating in Firestore`);

      // Tự động gọi API generate-pdf ở background nếu có payload
      if (data.payload) {
        console.log(`Triggering background PDF generation for order ${orderCode}`);
        try {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ncn-academy-web.vercel.app';
          // Phải dùng await để Vercel không đóng băng container trước khi fetch xong!
          // SePay có thể bị timeout (báo lỗi đỏ trên SePay) nhưng tiến trình vẫn sẽ chạy ngầm trên Vercel.
          await fetch(`${baseUrl}/api/generate-pdf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data.payload, orderCode })
          }).catch(err => console.error("Background PDF API failed:", err));
        } catch (err) {
          console.error("Failed to trigger background PDF API:", err);
          await docRef.set({ pdfGenerating: false }, { merge: true });
        }
      }

    } else {
      console.error("Cannot update Firestore because Firebase Admin is not initialized.");
    }
    
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Lỗi webhook SePay:', error);
    return NextResponse.json({ error: error.message || 'Lỗi server' }, { status: 500, headers: corsHeaders });
  }
}
