/**
 * Auth helpers — Firebase Admin init + JWT utilities
 * Dùng cho các Next.js API routes auth (register, login, me, refresh)
 */
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { SignJWT, jwtVerify } from 'jose';

// ── Firebase Admin ─────────────────────────────────────────────
export function getDb() {
  if (!getApps().length) {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
    initializeApp({ credential: cert(sa) });
  }
  return getFirestore();
}

// ── JWT ────────────────────────────────────────────────────────
const JWT_SECRET_RAW = () => process.env.JWT_SECRET ?? 'ncn-jwt-secret-change-me-2026';
const getSecret = () => new TextEncoder().encode(JWT_SECRET_RAW());

const ACCESS_TOKEN_EXPIRY  = '24h';   // generous for SPA
const REFRESH_TOKEN_EXPIRY = '30d';

export interface JwtPayload {
  sub: string;    // userId (Firestore doc id)
  email: string;
  role: string;
  type?: 'access' | 'refresh';
}

export async function signAccessToken(payload: Omit<JwtPayload, 'type'>) {
  return new SignJWT({ ...payload, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(getSecret());
}

export async function signRefreshToken(payload: Omit<JwtPayload, 'type'>) {
  return new SignJWT({ ...payload, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

// ── Helpers ────────────────────────────────────────────────────
export function generateAffiliateCode(length = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

// CORS headers shared across auth routes
export const authCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
