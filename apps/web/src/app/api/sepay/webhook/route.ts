import { NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
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

// GET — dùng để test xem URL webhook có reachable không (SePay ping test)
export async function GET() {
  return NextResponse.json(
    { status: 'ok', message: 'NCN SePay webhook endpoint is reachable', timestamp: new Date().toISOString() },
    { headers: corsHeaders }
  );
}

export async function POST(req: Request) {
  // Initialize Firebase Admin if not already initialized
  if (!getApps().length) {
    try {
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
        initializeApp({
          credential: cert(serviceAccount)
        });
      } else {
        console.warn("Missing FIREBASE_SERVICE_ACCOUNT environment variable. Firestore updates via webhook will fail.");
      }
    } catch (error) {
      console.error("Firebase admin init error:", error);
    }
  }

  try {
    const authHeader = req.headers.get('authorization') || '';
    if (process.env.SEPAY_API_KEY && !authHeader.includes(process.env.SEPAY_API_KEY)) {
      console.warn(`[SePay] Auth FAILED. Received header: "${authHeader.substring(0, 30)}..." | SEPAY_API_KEY configured: ${!!process.env.SEPAY_API_KEY}`);
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    console.warn("SePay Webhook received:", JSON.stringify(body));
    
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
      console.warn(`Ignoring transaction. Content does not contain NCN [orderCode]: ${content}`);
      return NextResponse.json({ success: true, message: 'Ignored (Not NCN order)' }, { headers: corsHeaders });
    }
    
    const orderCode = match[1];
    console.warn(`Extracted Order Code: ${orderCode}, Amount: ${amount}`);
    
    // Update Firestore
    if (getApps().length) {
      const db = getFirestore();
      const docRef = db.collection('orders').doc(orderCode);
      const docSnap = await docRef.get();
      const data = docSnap.exists ? docSnap.data() : null;

      if (!data) {
        console.warn(`Order ${orderCode} not found in database.`);
        return NextResponse.json({ success: true, message: 'Order not found' }, { headers: corsHeaders });
      }

      // Check if amount is sufficient
      const expectedAmount = Number(data.amount || 0);
      if (amount < expectedAmount) {
        console.warn(`Insufficient amount for order ${orderCode}. Expected ${expectedAmount}, received ${amount}`);
        // Save partial payment but don't generate PDF
        await docRef.set({
           status: 'PARTIAL_PAID',
           paidAmount: amount,
           sepayData: payload,
           updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
        return NextResponse.json({ success: true, message: 'Insufficient amount' }, { headers: corsHeaders });
      }

      // Skip if already generating
      if (data.pdfGenerating || data.pdfDone) {
        console.warn(`Order ${orderCode} is already paid or generating PDF. Returning early.`);
        return NextResponse.json({ success: true, message: 'Already Processing' }, { headers: corsHeaders });
      }

      await docRef.set({
        status: 'PAID',
        paidAmount: amount,
        sepayData: payload,
        paidAt: FieldValue.serverTimestamp(),
        pdfGenerating: true
      }, { merge: true });
      
      console.warn(`Order ${orderCode} marked as PAID and PDF generating in Firestore`);

      // Sync purchase status to the matching lead (if one exists) so the
      // nurture sequence (onLeadCreated / dailyNurtureSend) reacts to this purchase.
      const buyerEmail = data.payload?.EMAIL;
      if (buyerEmail && buyerEmail !== 'Không cung cấp') {
        const leadsSnap = await db.collection('leads').where('email', '==', buyerEmail).limit(1).get();
        if (!leadsSnap.empty) {
          const leadRef = leadsSnap.docs[0].ref;
          const isCoursePurchase = String(data.productType || data.payload?.PRODUCT_TYPE || 'pdf').toLowerCase() === 'course';
          const purchaseUpdate = isCoursePurchase
            ? {
                'purchases.coursePurchased': true,
                'purchases.coursePurchasedAt': FieldValue.serverTimestamp(),
                'emailSequence.unsubscribed': true,
              }
            : {
                'purchases.pdfPurchased': true,
                'purchases.pdfPurchasedAt': FieldValue.serverTimestamp(),
              };
          await leadRef.update(purchaseUpdate);
          console.warn(`Updated lead ${leadRef.id} purchases for order ${orderCode} (course=${isCoursePurchase})`);
        } else {
          console.warn(`No lead found for email ${buyerEmail}, skipping emailSequence update.`);
        }
      }

      // Đã chuyển phần gọi API generate-pdf sang cho Frontend (script.js) xử lý
      // để tránh việc Vercel Webhook bị timeout sau 10s (giới hạn của gói Hobby).

    } else {
      console.error("Cannot update Firestore because Firebase Admin is not initialized.");
    }
    
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Lỗi webhook SePay:', error);
    return NextResponse.json({ error: error.message || 'Lỗi server' }, { status: 500, headers: corsHeaders });
  }
}
