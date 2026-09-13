/**
 * POST /api/admin/bootstrap
 * Body: { "secret": "ncn-bootstrap-2026", "email": "email@example.com" }
 * 
 * Set role ADMIN cho user (tìm theo email trong Firestore `users` collection).
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

    initFirebase();
    const db = getFirestore();

    // Find user by email in Firestore
    const snap = await db.collection('users')
      .where('email', '==', email.toLowerCase().trim())
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({
        success: false,
        error: `Không tìm thấy user với email: ${email}. Hãy đăng ký trước.`,
      }, { status: 404 });
    }

    const userDoc = snap.docs[0];
    await userDoc.ref.update({ role: 'ADMIN' });

    return NextResponse.json({
      success: true,
      message: `Đã set ADMIN cho ${email} (ID: ${userDoc.id})`,
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

