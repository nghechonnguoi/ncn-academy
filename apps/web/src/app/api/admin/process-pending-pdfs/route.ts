/**
 * GET /api/admin/process-pending-pdfs
 * 
 * Cron job chạy mỗi 5 phút để tự xử lý các orders đã PAID
 * nhưng chưa tạo PDF (pdfDone=false).
 * 
 * Nguyên nhân hay xảy ra: User đóng browser ngay sau khi thanh toán
 * trước khi frontend polling kịp trigger generate-pdf.
 */
import { NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Pro plan: cho phép 5 phút

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function initFirebase() {
  if (!getApps().length && process.env.FIREBASE_SERVICE_ACCOUNT) {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
    initializeApp({ credential: cert(sa) });
  }
  return getFirestore();
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req: Request) {
  return handler(req);
}

export async function POST(req: Request) {
  return handler(req);
}

async function handler(req: Request) {
  const startTime = Date.now();
  const results: any[] = [];

  try {
    const db = initFirebase();

    // Tìm orders: status=PAID và pdfDone=false hoặc chưa có
    // Chỉ xử lý orders tạo trong 24 giờ qua để tránh re-process cũ
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const snap = await db.collection('orders')
      .where('status', 'in', ['PAID', 'paid'])
      .where('pdfDone', '==', false)
      .orderBy('createdAt', 'desc')
      .limit(5)  // Xử lý tối đa 5 orders mỗi lần
      .get();

    if (snap.empty) {
      return NextResponse.json({
        success: true,
        message: 'No pending orders to process',
        processed: 0,
        elapsed: Date.now() - startTime,
      }, { headers: corsHeaders });
    }

    console.warn(`[process-pending-pdfs] Found ${snap.size} orders to process`);

    // Xử lý từng order
    const origin = new URL(req.url).origin;
    
    for (const doc of snap.docs) {
      const data = doc.data();
      const orderCode = doc.id;
      const payload = data.payload;

      // Skip nếu không có payload (dữ liệu không đủ để tạo PDF)
      if (!payload || Object.keys(payload).length < 5) {
        console.warn(`[process-pending-pdfs] Order ${orderCode}: no payload, skipping`);
        results.push({ orderCode, status: 'skipped', reason: 'no_payload' });
        continue;
      }

      // Skip nếu đang generating (tránh double-process)
      if (data.pdfGenerating === true) {
        const updatedAt = data.updatedAt?.toDate?.() ?? data.paidAt?.toDate?.();
        const minutesAgo = updatedAt ? (Date.now() - updatedAt.getTime()) / 60000 : 999;
        if (minutesAgo < 10) {
          // Đang generating và mới < 10 phút → chờ
          results.push({ orderCode, status: 'skipped', reason: 'generating_recently' });
          continue;
        }
      }

      console.warn(`[process-pending-pdfs] Processing order ${orderCode}...`);
      
      // Mark đang xử lý để tránh cron khác process cùng lúc
      await doc.ref.update({ pdfGenerating: true, cronTriggeredAt: new Date().toISOString() });

      try {
        const pdfRes = await fetch(`${origin}/api/generate-pdf`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, orderCode: Number(orderCode) }),
        });

        const pdfData = await pdfRes.json().catch(() => ({}));
        
        results.push({
          orderCode,
          status: pdfRes.ok ? 'success' : 'failed',
          httpStatus: pdfRes.status,
          emailError: pdfData.emailError ?? null,
        });

        console.warn(`[process-pending-pdfs] Order ${orderCode}: ${pdfRes.ok ? 'SUCCESS' : 'FAILED'}`);
      } catch (err: any) {
        console.error(`[process-pending-pdfs] Order ${orderCode} error:`, err.message);
        await doc.ref.update({ pdfGenerating: false, cronError: err.message });
        results.push({ orderCode, status: 'error', error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
      elapsed: Date.now() - startTime,
    }, { headers: corsHeaders });

  } catch (err: any) {
    console.error('[process-pending-pdfs] Fatal error:', err);
    return NextResponse.json({
      success: false,
      error: err.message,
      elapsed: Date.now() - startTime,
    }, { status: 500, headers: corsHeaders });
  }
}
