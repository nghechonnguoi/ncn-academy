/**
 * POST /api/auth/register
 * Body: { email, name, password, referralCode? }
 * Tạo user mới trên Firestore, trả về JWT tokens
 */
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { FieldValue } from 'firebase-admin/firestore';
import {
  getDb, signAccessToken, signRefreshToken,
  generateAffiliateCode, authCorsHeaders,
} from '@/lib/auth-firebase';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return NextResponse.json({}, { headers: authCorsHeaders });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, password, referralCode } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email và mật khẩu là bắt buộc' },
        { status: 400, headers: authCorsHeaders },
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Mật khẩu phải có ít nhất 8 ký tự' },
        { status: 400, headers: authCorsHeaders },
      );
    }

    const db = getDb();

    // Check duplicate email
    const existingSnap = await db.collection('users')
      .where('email', '==', email.toLowerCase().trim())
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      return NextResponse.json(
        { message: 'Email đã được sử dụng' },
        { status: 409, headers: authCorsHeaders },
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    const affiliateCode = generateAffiliateCode();

    // Create user document
    const userRef = db.collection('users').doc();
    const userData = {
      email: email.toLowerCase().trim(),
      name: name?.trim() || 'Người dùng',
      password: hashedPassword,
      role: 'USER',
      plan: 'FREE',
      affiliateCode,
      referredBy: referralCode || null,
      createdAt: FieldValue.serverTimestamp(),
    };
    await userRef.set(userData);

    const userId = userRef.id;

    // Generate tokens
    const tokenPayload = { sub: userId, email: userData.email, role: 'USER' };
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
        name: userData.name,
        role: userData.role,
        plan: userData.plan,
        affiliateCode: userData.affiliateCode,
      },
      accessToken,
      refreshToken,
      expiresIn: 86400,
    }, { headers: authCorsHeaders });

  } catch (err: any) {
    console.error('[auth/register] Error:', err);
    return NextResponse.json(
      { message: 'Có lỗi xảy ra, vui lòng thử lại' },
      { status: 500, headers: authCorsHeaders },
    );
  }
}
