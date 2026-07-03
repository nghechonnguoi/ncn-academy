import { NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// 50 valid codes
const VALID_COUPONS = [
  "VIP-XUGUC", "VIP-VV4XY", "VIP-3J6PC", "GIFT-WNQ2J", "FREE-0MKTG", 
  "FREE-7PSNP", "VIP-YITXC", "NCN-7YJVL", "FREE-AZY5F", "PRO-8RHYW", 
  "NCN-LPB5S", "PRO-OKIEY", "VIP-DEICS", "NCN-WH8FL", "VIP-GPLKX", 
  "NCN-FLPN9", "PRO-4JZMK", "FREE-NXKYM", "FREE-I3JHW", "FREE-QZRGO", 
  "NCN-XZERO", "GIFT-XQGIZ", "NCN-5YBOG", "PRO-GYHSV", "GIFT-FBRXE", 
  "GIFT-UX8A5", "GIFT-YQE2F", "VIP-ZNTKT", "FREE-XVZZB", "GIFT-5YFCK", 
  "GIFT-R0IEO", "PRO-IQSYO", "PRO-KVYW8", "GIFT-9FNGT", "PRO-SYBGI", 
  "VIP-FTSSX", "GIFT-URNVD", "NCN-S5QWH", "VIP-BAILZ", "FREE-YJUZT", 
  "FREE-YGOSU", "GIFT-QESSI", "PRO-SYX4J", "GIFT-8X3QG", "GIFT-IVSTS", 
  "GIFT-UA5XB", "PRO-1CX8A", "FREE-8VHYF", "FREE-6NIAN", "FREE-M8O9E"
];

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  // Initialize Firebase Admin
  if (!getApps().length) {
    try {
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
        initializeApp({ credential: cert(serviceAccount) });
      } else {
        return NextResponse.json({ success: false, message: 'Server config error' }, { status: 500, headers: corsHeaders });
      }
    } catch (error) {
      console.error("Firebase admin init error:", error);
      return NextResponse.json({ success: false, message: 'Server init error' }, { status: 500, headers: corsHeaders });
    }
  }

  try {
    const body = await req.json();
    const couponCode = (body.coupon || "").toUpperCase().trim();
    const orderCode = body.orderCode || "";
    
    if (!couponCode) {
      return NextResponse.json({ success: false, message: 'Vui lòng nhập mã giảm giá' }, { headers: corsHeaders });
    }
    
    if (!VALID_COUPONS.includes(couponCode)) {
      return NextResponse.json({ success: false, message: 'Mã giảm giá không tồn tại' }, { headers: corsHeaders });
    }

    if (!orderCode) {
      return NextResponse.json({ success: false, message: 'Thiếu mã đơn hàng (orderCode)' }, { headers: corsHeaders });
    }

    const db = getFirestore();
    const couponRef = db.collection('used_coupons').doc(couponCode);
    
    // Check if used in a transaction
    const result = await db.runTransaction(async (t) => {
      const doc = await t.get(couponRef);
      if (doc.exists && doc.data()?.used) {
        throw new Error("USED");
      }
      
      // Mark as used
      t.set(couponRef, {
        used: true,
        orderCode: orderCode,
        usedAt: FieldValue.serverTimestamp()
      });
      
      // Mark order as PAID so PDF will generate
      const orderRef = db.collection('orders').doc(orderCode);
      t.set(orderRef, {
        status: 'PAID',
        paidAmount: 0,
        couponApplied: couponCode,
        paidAt: FieldValue.serverTimestamp(),
        pdfGenerating: true
      }, { merge: true });
      
      return true;
    });

    return NextResponse.json({ success: true, message: 'Áp dụng mã thành công!' }, { headers: corsHeaders });
    
  } catch (error: any) {
    console.error('Lỗi apply-coupon:', error);
    if (error.message === "USED") {
      return NextResponse.json({ success: false, message: 'Mã giảm giá này đã được sử dụng' }, { headers: corsHeaders });
    }
    return NextResponse.json({ success: false, message: error.message || 'Lỗi server' }, { status: 500, headers: corsHeaders });
  }
}
