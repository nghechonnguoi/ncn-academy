/**
 * GET /api/affiliate/commissions?page=1&limit=20
 * Trả về lịch sử hoa hồng của user hiện tại — đọc từ Firestore.
 * Thay thế NestJS /api/v1/affiliate/commissions (không reachable từ Vercel production).
 *
 * Header: Authorization: Bearer <accessToken>
 */
import { NextResponse } from 'next/server';
import { getDb, verifyToken, authCorsHeaders } from '@/lib/auth-firebase';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return NextResponse.json({}, { headers: authCorsHeaders });
}

export async function GET(req: Request) {
  try {
    // ── Xác thực token ──────────────────────────────────────────
    const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
    if (!token) {
      return NextResponse.json({ message: 'Chưa đăng nhập' }, { status: 401, headers: authCorsHeaders });
    }
    const payload = await verifyToken(token);
    if (!payload || payload.type !== 'access') {
      return NextResponse.json({ message: 'Token không hợp lệ' }, { status: 401, headers: authCorsHeaders });
    }

    const { searchParams } = new URL(req.url);
    const page  = Math.max(1, parseInt(searchParams.get('page')  ?? '1'));
    const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20'));

    const db = getDb();

    // ── Đọc affiliateCode của user ──────────────────────────────
    const userDoc = await db.collection('users').doc(payload.sub).get();
    if (!userDoc.exists) {
      return NextResponse.json({ message: 'User không tồn tại' }, { status: 404, headers: authCorsHeaders });
    }
    const affiliateCode: string = userDoc.data()!.affiliateCode || '';

    if (!affiliateCode) {
      return NextResponse.json({ data: [], total: 0, page, limit }, { headers: authCorsHeaders });
    }

    // ── Query tất cả commissions của affiliate này ─────────────
    const snap = await db.collection('affiliate_commissions')
      .where('referralCode', '==', affiliateCode)
      .get();

    // Sắp xếp và phân trang trong JS
    // (Firestore free tier không có composite index sẵn cho referralCode + createdAt)
    const allDocs = snap.docs
      .map(doc => {
        const d = doc.data();
        const createdAtRaw = d.createdAt;

        // createdAt có thể là Firestore Timestamp hoặc Date object hoặc string
        let createdAt: string;
        if (createdAtRaw?.toDate) {
          createdAt = createdAtRaw.toDate().toISOString();
        } else if (createdAtRaw instanceof Date) {
          createdAt = createdAtRaw.toISOString();
        } else {
          createdAt = createdAtRaw ? String(createdAtRaw) : new Date(0).toISOString();
        }

        return {
          id:               doc.id,
          referralCode:     d.referralCode,
          orderCode:        d.orderCode,
          amount:           Number(d.commissionAmount ?? 0), // hoa hồng (đã tính %)
          orderAmount:      Number(d.amount ?? 0),           // tiền đơn hàng gốc
          customerName:     d.customerName || '',
          customerEmail:    d.customerEmail || '',
          status:           d.status || 'PENDING',
          source:           d.source || 'sepay_webhook',
          createdAt,
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total  = allDocs.length;
    const offset = (page - 1) * limit;
    const data   = allDocs.slice(offset, offset + limit);

    return NextResponse.json({ data, total, page, limit }, { headers: authCorsHeaders });

  } catch (err: any) {
    console.error('[affiliate/commissions] error:', err);
    return NextResponse.json({ message: err.message }, { status: 500, headers: authCorsHeaders });
  }
}
