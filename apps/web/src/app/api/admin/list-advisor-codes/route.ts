import { NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const SECRET = process.env.BOOTSTRAP_SECRET ?? 'ncn-bootstrap-2026';

function initFirebase() {
  if (!getApps().length) {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
    initializeApp({ credential: cert(sa) });
  }
}

/**
 * GET /api/admin/list-advisor-codes?secret=...&prefix=VAN
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');
  const prefix = searchParams.get('prefix') || '';

  if (secret !== SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  initFirebase();
  const db = getFirestore();

  const snapshot = await db.collection('coupons').orderBy('createdAt', 'asc').get();
  const codes: string[] = [];
  snapshot.forEach(doc => {
    if (!prefix || doc.id.startsWith(prefix)) {
      codes.push(doc.id);
    }
  });

  return NextResponse.json({ codes, count: codes.length });
}
