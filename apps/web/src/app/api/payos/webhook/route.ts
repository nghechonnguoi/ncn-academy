import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

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
          credential: admin.credential.cert(serviceAccount)
        });
      }
    } catch (error) {
      console.error("Firebase admin init error:", error);
    }
  }

  try {
    const body = await req.json();
    console.log("PayOS Webhook received:", body);
    
    // PayOS usually sends the success event in `data.code` = '00'
    const payload = body.data || body;
    const orderCode = payload.orderCode;
    const amount = payload.amount;
    
    if (!orderCode) {
      return NextResponse.json({ success: false, message: 'No orderCode found in webhook' }, { headers: corsHeaders });
    }
    
    console.log(`Extracted Order Code: ${orderCode}, Amount: ${amount}`);
    
    // Update Firestore
    // @ts-ignore
    if (admin.apps?.length) {
      const db = getFirestore();
      const docRef = db.collection('orders').doc(String(orderCode));
      const docSnap = await docRef.get();
      const data = docSnap.exists ? docSnap.data() : null;

      if (!data) {
        console.warn(`Order ${orderCode} not found in database.`);
        return NextResponse.json({ success: true, message: 'Order not found' }, { headers: corsHeaders });
      }

      if (data.pdfGenerating || data.pdfDone) {
        console.log(`Order ${orderCode} is already paid or generating PDF. Returning early.`);
        return NextResponse.json({ success: true, message: 'Already Processing' }, { headers: corsHeaders });
      }

      await docRef.set({
        status: 'PAID',
        paidAmount: amount,
        payosData: payload,
        paidAt: FieldValue.serverTimestamp(),
        pdfGenerating: true
      }, { merge: true });
      
      console.log(`Order ${orderCode} marked as PAID and PDF generating in Firestore`);

      if (data.payload) {
        console.log(`Triggering background PDF generation for order ${orderCode}`);
        try {
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ncn-academy-web.vercel.app';
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
    console.error('Lỗi webhook PayOS:', error);
    return NextResponse.json({ error: error.message || 'Lỗi server' }, { status: 500, headers: corsHeaders });
  }
}
