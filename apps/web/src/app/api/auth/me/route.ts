/**
 * GET /api/auth/me
 * Header: Authorization: Bearer <accessToken>
 * Trả về thông tin user hiện tại
 */
import { NextResponse } from 'next/server';
import { getDb, verifyToken, authCorsHeaders } from '@/lib/auth-firebase';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return NextResponse.json({}, { headers: authCorsHeaders });
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') ?? '';
    const token = authHeader.replace(/^Bearer\s+/i, '');

    if (!token) {
      return NextResponse.json(
        { message: 'Chưa đăng nhập' },
        { status: 401, headers: authCorsHeaders },
      );
    }

    const payload = await verifyToken(token);
    if (!payload || payload.type !== 'access') {
      return NextResponse.json(
        { message: 'Token không hợp lệ hoặc đã hết hạn' },
        { status: 401, headers: authCorsHeaders },
      );
    }

    const db = getDb();
    const userDoc = await db.collection('users').doc(payload.sub).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { message: 'Người dùng không tồn tại' },
        { status: 401, headers: authCorsHeaders },
      );
    }

    const userData = userDoc.data()!;

    return NextResponse.json({
      id: userDoc.id,
      email: userData.email,
      name: userData.name || '',
      role: userData.role || 'USER',
      plan: userData.plan || 'FREE',
      affiliateCode: userData.affiliateCode || '',
    }, { headers: authCorsHeaders });

  } catch (err: any) {
    console.error('[auth/me] Error:', err);
    return NextResponse.json(
      { message: 'Có lỗi xảy ra' },
      { status: 500, headers: authCorsHeaders },
    );
  }
}
