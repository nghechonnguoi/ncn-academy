import { NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function initFirebase() {
  if (!getApps().length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
    initializeApp({ credential: cert(serviceAccount) });
  }
}

// Dữ liệu gốc để seed Firestore lần đầu
const SEED_COUPONS = [
  { code: 'NADMIN',      type: 'ADMIN',  isAdmin: true,  note: 'Mã admin — dùng vô hạn lần',         discountAmount: 0 },
  { code: 'GIADINH500',  type: 'CUSTOM', isAdmin: false, note: 'Giảm 500.000đ cho khách hàng gia đình', discountAmount: 500000 },
  { code: 'VIP-XUGUC',  type: 'VIP',    isAdmin: false, note: '', discountAmount: 0 },
  { code: 'VIP-VV4XY',  type: 'VIP',    isAdmin: false, note: '', discountAmount: 0 },
  { code: 'VIP-3J6PC',  type: 'VIP',    isAdmin: false, note: '', discountAmount: 0 },
  { code: 'VIP-YITXC',  type: 'VIP',    isAdmin: false, note: '', discountAmount: 0 },
  { code: 'VIP-DEICS',  type: 'VIP',    isAdmin: false, note: '', discountAmount: 0 },
  { code: 'VIP-GPLKX',  type: 'VIP',    isAdmin: false, note: '', discountAmount: 0 },
  { code: 'VIP-ZNTKT',  type: 'VIP',    isAdmin: false, note: '', discountAmount: 0 },
  { code: 'VIP-BAILZ',  type: 'VIP',    isAdmin: false, note: '', discountAmount: 0 },
  { code: 'VIP-FTSSX',  type: 'VIP',    isAdmin: false, note: '', discountAmount: 0 },
  { code: 'FREE-0MKTG', type: 'FREE',   isAdmin: false, note: '', discountAmount: 0 },
  { code: 'FREE-7PSNP', type: 'FREE',   isAdmin: false, note: '', discountAmount: 0 },
  { code: 'FREE-AZY5F', type: 'FREE',   isAdmin: false, note: '', discountAmount: 0 },
  { code: 'FREE-NXKYM', type: 'FREE',   isAdmin: false, note: '', discountAmount: 0 },
  { code: 'FREE-I3JHW', type: 'FREE',   isAdmin: false, note: '', discountAmount: 0 },
  { code: 'FREE-QZRGO', type: 'FREE',   isAdmin: false, note: '', discountAmount: 0 },
  { code: 'FREE-XVZZB', type: 'FREE',   isAdmin: false, note: '', discountAmount: 0 },
  { code: 'FREE-YJUZT', type: 'FREE',   isAdmin: false, note: '', discountAmount: 0 },
  { code: 'FREE-YGOSU', type: 'FREE',   isAdmin: false, note: '', discountAmount: 0 },
  { code: 'FREE-8VHYF', type: 'FREE',   isAdmin: false, note: '', discountAmount: 0 },
  { code: 'FREE-6NIAN', type: 'FREE',   isAdmin: false, note: '', discountAmount: 0 },
  { code: 'FREE-M8O9E', type: 'FREE',   isAdmin: false, note: '', discountAmount: 0 },
  { code: 'NCN-7YJVL',  type: 'NCN',    isAdmin: false, note: '', discountAmount: 0 },
  { code: 'NCN-LPB5S',  type: 'NCN',    isAdmin: false, note: '', discountAmount: 0 },
  { code: 'NCN-WH8FL',  type: 'NCN',    isAdmin: false, note: '', discountAmount: 0 },
  { code: 'NCN-FLPN9',  type: 'NCN',    isAdmin: false, note: '', discountAmount: 0 },
  { code: 'NCN-XZERO',  type: 'NCN',    isAdmin: false, note: '', discountAmount: 0 },
  { code: 'NCN-5YBOG',  type: 'NCN',    isAdmin: false, note: '', discountAmount: 0 },
  { code: 'NCN-S5QWH',  type: 'NCN',    isAdmin: false, note: '', discountAmount: 0 },
  { code: 'PRO-8RHYW',  type: 'PRO',    isAdmin: false, note: '', discountAmount: 0 },
  { code: 'PRO-OKIEY',  type: 'PRO',    isAdmin: false, note: '', discountAmount: 0 },
  { code: 'PRO-4JZMK',  type: 'PRO',    isAdmin: false, note: '', discountAmount: 0 },
  { code: 'PRO-GYHSV',  type: 'PRO',    isAdmin: false, note: '', discountAmount: 0 },
  { code: 'PRO-IQSYO',  type: 'PRO',    isAdmin: false, note: '', discountAmount: 0 },
  { code: 'PRO-KVYW8',  type: 'PRO',    isAdmin: false, note: '', discountAmount: 0 },
  { code: 'PRO-SYBGI',  type: 'PRO',    isAdmin: false, note: '', discountAmount: 0 },
  { code: 'PRO-SYX4J',  type: 'PRO',    isAdmin: false, note: '', discountAmount: 0 },
  { code: 'PRO-1CX8A',  type: 'PRO',    isAdmin: false, note: '', discountAmount: 0 },
  { code: 'GIFT-WNQ2J', type: 'GIFT',   isAdmin: false, note: '', discountAmount: 0 },
  { code: 'GIFT-XQGIZ', type: 'GIFT',   isAdmin: false, note: '', discountAmount: 0 },
  { code: 'GIFT-FBRXE', type: 'GIFT',   isAdmin: false, note: '', discountAmount: 0 },
  { code: 'GIFT-UX8A5', type: 'GIFT',   isAdmin: false, note: '', discountAmount: 0 },
  { code: 'GIFT-YQE2F', type: 'GIFT',   isAdmin: false, note: '', discountAmount: 0 },
  { code: 'GIFT-5YFCK', type: 'GIFT',   isAdmin: false, note: '', discountAmount: 0 },
  { code: 'GIFT-R0IEO', type: 'GIFT',   isAdmin: false, note: '', discountAmount: 0 },
  { code: 'GIFT-9FNGT', type: 'GIFT',   isAdmin: false, note: '', discountAmount: 0 },
  { code: 'GIFT-URNVD', type: 'GIFT',   isAdmin: false, note: '', discountAmount: 0 },
  { code: 'GIFT-QESSI', type: 'GIFT',   isAdmin: false, note: '', discountAmount: 0 },
  { code: 'GIFT-8X3QG', type: 'GIFT',   isAdmin: false, note: '', discountAmount: 0 },
  { code: 'GIFT-IVSTS', type: 'GIFT',   isAdmin: false, note: '', discountAmount: 0 },
  { code: 'GIFT-UA5XB', type: 'GIFT',   isAdmin: false, note: '', discountAmount: 0 },
];

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET — list tất cả mã + trạng thái đã dùng
export async function GET() {
  try {
    initFirebase();
    const db = getFirestore();

    let couponsSnap = await db.collection('coupons').get();

    // Auto-seed lần đầu nếu collection rỗng
    if (couponsSnap.empty) {
      const batch = db.batch();
      for (const c of SEED_COUPONS) {
        batch.set(db.collection('coupons').doc(c.code), {
          ...c, active: true, createdAt: FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();
      couponsSnap = await db.collection('coupons').get();
    }

    // Đọc used_coupons
    const usedSnap = await db.collection('used_coupons').get();
    const usedMap: Record<string, { orderCode: string; usedAt: any }> = {};
    for (const d of usedSnap.docs) {
      if (d.data()?.used) usedMap[d.id] = { orderCode: d.data().orderCode, usedAt: d.data().usedAt };
    }

    const coupons = couponsSnap.docs
      .map(d => {
        const data = d.data();
        const usage = usedMap[d.id];
        return {
          code:           data.code,
          type:           data.type,
          isAdmin:        data.isAdmin,
          note:           data.note,
          discountAmount: Number(data.discountAmount ?? 0),
          active:         data.active !== false,
          used:           !!usage,
          orderCode:      usage?.orderCode ?? null,
          usedAt:         usage?.usedAt?.toDate?.()?.toISOString?.() ?? null,
          createdAt:      data.createdAt?.toDate?.()?.toISOString?.() ?? null,
        };
      })
      .sort((a, b) => {
        // Sắp xếp: ADMIN trước, rồi theo type, rồi theo code
        if (a.type === 'ADMIN') return -1;
        if (b.type === 'ADMIN') return 1;
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        return a.code.localeCompare(b.code);
      });

    return NextResponse.json({ success: true, coupons }, { headers: corsHeaders });
  } catch (err: any) {
    console.error('GET /api/admin/coupons error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders });
  }
}

// POST — tạo mã mới
export async function POST(req: Request) {
  try {
    initFirebase();
    const db = getFirestore();
    const body = await req.json();

    const code           = String(body.code    || '').toUpperCase().trim();
    const type           = String(body.type    || 'CUSTOM').toUpperCase();
    const isAdmin        = body.isAdmin === true;
    const note           = String(body.note    || '').trim();
    const discountAmount = Number(body.discountAmount ?? 0); // 0 = miễn phí, >0 = giảm theo số tiền

    if (!code) {
      return NextResponse.json({ success: false, error: 'Thiếu mã coupon' }, { status: 400, headers: corsHeaders });
    }
    if (!/^[A-Z0-9\-]+$/.test(code)) {
      return NextResponse.json({ success: false, error: 'Mã chỉ được chứa chữ in hoa, số và dấu gạch ngang' }, { status: 400, headers: corsHeaders });
    }
    if (code.length < 4 || code.length > 30) {
      return NextResponse.json({ success: false, error: 'Mã phải từ 4–30 ký tự' }, { status: 400, headers: corsHeaders });
    }

    const docRef  = db.collection('coupons').doc(code);
    const existing = await docRef.get();
    if (existing.exists) {
      return NextResponse.json({ success: false, error: `Mã ${code} đã tồn tại` }, { status: 409, headers: corsHeaders });
    }

    await docRef.set({ code, type, isAdmin, note, discountAmount, active: true, createdAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ success: true, message: `Đã tạo mã ${code}` }, { headers: corsHeaders });
  } catch (err: any) {
    console.error('POST /api/admin/coupons error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders });
  }
}

// DELETE — xóa mã (chỉ được xóa mã chưa dùng)
export async function DELETE(req: Request) {
  try {
    initFirebase();
    const db = getFirestore();
    const body = await req.json();
    const code = String(body.code || '').toUpperCase().trim();

    if (!code) {
      return NextResponse.json({ success: false, error: 'Thiếu mã coupon' }, { status: 400, headers: corsHeaders });
    }

    const usedDoc = await db.collection('used_coupons').doc(code).get();
    if (usedDoc.exists && usedDoc.data()?.used) {
      return NextResponse.json({
        success: false, error: `Mã ${code} đã được sử dụng — không thể xóa`
      }, { status: 400, headers: corsHeaders });
    }

    await db.collection('coupons').doc(code).delete();
    return NextResponse.json({ success: true, message: `Đã xóa mã ${code}` }, { headers: corsHeaders });
  } catch (err: any) {
    console.error('DELETE /api/admin/coupons error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders });
  }
}
