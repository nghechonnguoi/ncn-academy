/**
 * TEMPORARY admin bootstrap API — XÓA SAU KHI DÙNG
 * POST /api/admin/bootstrap
 * Body: { "secret": "ncn-bootstrap-2026", "email": "email-cua-ban@example.com" }
 * 
 * Endpoint này set role ADMIN cho một email cụ thể.
 * Chỉ hoạt động nếu secret khớp.
 */

import { NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

const BOOTSTRAP_SECRET = process.env.BOOTSTRAP_SECRET ?? 'ncn-bootstrap-2026';

function initFirebase() {
  if (!getApps().length) {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
    initializeApp({ credential: cert(sa) });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { secret, email } = body;

    if (!secret || secret !== BOOTSTRAP_SECRET) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    if (!email) {
      return NextResponse.json({ success: false, error: 'Thiếu email' }, { status: 400 });
    }

    // Backend dùng PostgreSQL (Prisma), không dùng Firestore cho users
    // → Gọi API backend trực tiếp thông qua URL nội bộ
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? 'http://localhost:3001';

    // Cố gắng kết nối backend NestJS để update role
    const backendRes = await fetch(`${apiUrl}/api/v1/users/set-admin`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Internal-Secret': BOOTSTRAP_SECRET,
      },
      body: JSON.stringify({ email }),
    }).catch(() => null);

    if (backendRes && backendRes.ok) {
      return NextResponse.json({ success: true, message: `Đã set ADMIN cho ${email}` });
    }

    // Nếu backend không có endpoint đó, trả về hướng dẫn
    return NextResponse.json({
      success: false,
      error: 'Backend không hỗ trợ endpoint này. Cần update trực tiếp trong database.',
      hint: `Chạy lệnh SQL: UPDATE "User" SET role = 'ADMIN' WHERE email = '${email}';`,
      apiUrl,
    }, { status: 501 });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
