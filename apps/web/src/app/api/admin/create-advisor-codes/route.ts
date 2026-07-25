import { NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const SECRET = 'ncn-bootstrap-2026';

function initFirebase() {
  if (!getApps().length) {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
    initializeApp({ credential: cert(sa) });
  }
}

function generateCode(prefix: string): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 3; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}${suffix}`;
}

/**
 * POST /api/admin/create-advisor-codes
 * Body: { secret, prefix, quantity, advisorName, advisorEmail, advisorPhone }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { secret, prefix, quantity = 10, advisorName, advisorEmail, advisorPhone = '' } = body;

    if (secret !== SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!prefix || !advisorName || !advisorEmail) {
      return NextResponse.json({ success: false, error: 'Thiếu prefix, advisorName, hoặc advisorEmail' }, { status: 400 });
    }

    initFirebase();
    const db = getFirestore();

    // Kiểm tra trùng mã
    const existingCodes = new Set<string>();
    const snapshot = await db.collection('coupons').get();
    snapshot.forEach(doc => existingCodes.add(doc.id));

    const batch = db.batch();
    const codes: string[] = [];

    for (let i = 0; i < quantity; i++) {
      let code: string;
      let attempts = 0;
      do {
        code = generateCode(prefix);
        attempts++;
        if (attempts > 1000) throw new Error('Quá nhiều mã trùng — thử prefix khác');
      } while (existingCodes.has(code!) || codes.includes(code!));

      codes.push(code!);
      const ref = db.collection('coupons').doc(code!);
      batch.set(ref, {
        code:           code,
        discountAmount: 0,
        active:         true,
        isAdmin:        true,
        usedBy:         null,
        usedAt:         null,
        createdAt:      FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();

    // Lưu mapping prefix → tư vấn viên
    const prefixRef = db.doc('config/advisorPrefixes');
    await prefixRef.set(
      {
        [prefix]: { name: advisorName, email: advisorEmail, phone: advisorPhone },
      },
      { merge: true }
    );

    return NextResponse.json({
      success: true,
      codes,
      summary: {
        prefix,
        quantity: codes.length,
        advisorName,
        advisorEmail,
        advisorPhone,
      },
    });
  } catch (err: any) {
    console.error('[create-advisor-codes]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
