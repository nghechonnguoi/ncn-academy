/**
 * POST /api/auth/login
 * Body: { email, password }
 * Xác thực user, trả về JWT tokens
 */
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import {
  getDb, signAccessToken, signRefreshToken, authCorsHeaders,
} from '@/lib/auth-firebase';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return NextResponse.json({}, { headers: authCorsHeaders });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email và mật khẩu là bắt buộc' },
        { status: 400, headers: authCorsHeaders },
      );
    }

    const db = getDb();

    // Find user by email
    const snap = await db.collection('users')
      .where('email', '==', email.toLowerCase().trim())
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json(
        { message: 'Email hoặc mật khẩu không đúng' },
        { status: 401, headers: authCorsHeaders },
      );
    }

    const userDoc = snap.docs[0];
    const userData = userDoc.data();

    if (!userData.password) {
      return NextResponse.json(
        { message: 'Email hoặc mật khẩu không đúng' },
        { status: 401, headers: authCorsHeaders },
      );
    }

    // Verify password
    const valid = await bcrypt.compare(password, userData.password);
    if (!valid) {
      return NextResponse.json(
        { message: 'Email hoặc mật khẩu không đúng' },
        { status: 401, headers: authCorsHeaders },
      );
    }

    const userId = userDoc.id;

    // Generate tokens
    const tokenPayload = { sub: userId, email: userData.email, role: userData.role || 'USER' };
    const accessToken  = await signAccessToken(tokenPayload);
    const refreshToken = await signRefreshToken(tokenPayload);

    // Store refresh token
    await db.collection('refresh_tokens').add({
      userId,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      user: {
        id: userId,
        email: userData.email,
        name: userData.name || '',
        role: userData.role || 'USER',
        plan: userData.plan || 'FREE',
        affiliateCode: userData.affiliateCode || '',
      },
      accessToken,
      refreshToken,
      expiresIn: 86400,
    }, { headers: authCorsHeaders });

  } catch (err: any) {
    console.error('[auth/login] Error:', err);
    return NextResponse.json(
      { message: 'Có lỗi xảy ra, vui lòng thử lại' },
      { status: 500, headers: authCorsHeaders },
    );
  }
}
