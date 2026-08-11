/**
 * POST /api/auth/refresh
 * Body: { refreshToken }
 * Tạo cặp tokens mới
 */
import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import {
  getDb, verifyToken, signAccessToken, signRefreshToken, authCorsHeaders,
} from '@/lib/auth-firebase';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return NextResponse.json({}, { headers: authCorsHeaders });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { message: 'Refresh token là bắt buộc' },
        { status: 400, headers: authCorsHeaders },
      );
    }

    // Verify JWT signature
    const payload = await verifyToken(refreshToken);
    if (!payload || payload.type !== 'refresh') {
      return NextResponse.json(
        { message: 'Refresh token không hợp lệ hoặc đã hết hạn' },
        { status: 401, headers: authCorsHeaders },
      );
    }

    const db = getDb();

    // Check refresh token exists in Firestore
    const tokenSnap = await db.collection('refresh_tokens')
      .where('token', '==', refreshToken)
      .where('userId', '==', payload.sub)
      .limit(1)
      .get();

    if (tokenSnap.empty) {
      return NextResponse.json(
        { message: 'Refresh token không hợp lệ' },
        { status: 401, headers: authCorsHeaders },
      );
    }

    // Delete old refresh token (rotation)
    await tokenSnap.docs[0].ref.delete();

    // Get fresh user data
    const userDoc = await db.collection('users').doc(payload.sub).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { message: 'Người dùng không tồn tại' },
        { status: 401, headers: authCorsHeaders },
      );
    }

    const userData = userDoc.data()!;
    const tokenPayload = {
      sub: payload.sub,
      email: userData.email,
      role: userData.role || 'USER',
    };

    // Generate new token pair
    const newAccessToken  = await signAccessToken(tokenPayload);
    const newRefreshToken = await signRefreshToken(tokenPayload);

    // Store new refresh token
    await db.collection('refresh_tokens').add({
      userId: payload.sub,
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 86400,
    }, { headers: authCorsHeaders });

  } catch (err: any) {
    console.error('[auth/refresh] Error:', err);
    return NextResponse.json(
      { message: 'Có lỗi xảy ra' },
      { status: 500, headers: authCorsHeaders },
    );
  }
}
