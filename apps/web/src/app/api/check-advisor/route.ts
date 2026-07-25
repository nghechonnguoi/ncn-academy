import { NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

function initFirebase() {
  if (!getApps().length) {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
    initializeApp({ credential: cert(sa) });
  }
}

/**
 * GET /api/check-advisor?code=NCN-PN7X2
 * Trả về thông tin tư vấn viên nếu mã có prefix khớp, null nếu không.
 * Public endpoint (không cần auth) — chỉ trả về name/phone, không trả email.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = (searchParams.get('code') || '').trim().toUpperCase();
    if (!code) {
      return NextResponse.json({ advisor: null });
    }

    initFirebase();
    const db = getFirestore();

    const prefixDoc = await db.doc('config/advisorPrefixes').get();
    if (!prefixDoc.exists) {
      return NextResponse.json({ advisor: null });
    }

    const prefixes = prefixDoc.data() as Record<string, { name: string; email: string; phone?: string }>;
    for (const prefix in prefixes) {
      if (code.startsWith(prefix)) {
        const { name, phone } = prefixes[prefix];
        // Trả về name và phone (không trả email — bảo mật)
        return NextResponse.json({ advisor: { name, phone: phone || '', email: prefixes[prefix].email } });
      }
    }

    return NextResponse.json({ advisor: null });
  } catch (err: any) {
    console.error('[check-advisor] error:', err);
    return NextResponse.json({ advisor: null });
  }
}
