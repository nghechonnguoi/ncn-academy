/**
 * backfill-affiliate.js
 * Chạy: node backfill-affiliate.js
 *
 * Query tất cả orders PAID hôm nay có referralCode trong Firestore,
 * sau đó gọi NestJS /affiliate/internal/sepay-sync cho từng order.
 */

require('dotenv').config({ path: '.env.local' });

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore }        = require('firebase-admin/firestore');
const https                   = require('https');
const http                    = require('http');

// ── Firebase Admin Init ────────────────────────────────────────────────────
const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountRaw) {
  console.error('❌ Thiếu FIREBASE_SERVICE_ACCOUNT trong .env.local');
  process.exit(1);
}

const serviceAccount = JSON.parse(serviceAccountRaw);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// ── Config ─────────────────────────────────────────────────────────────────
const API_URL         = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || 'ncn-internal-secret-2026';
const TARGET_DATE     = process.argv[2] || new Date().toISOString().split('T')[0]; // YYYY-MM-DD

// ── Helper: POST JSON ───────────────────────────────────────────────────────
function postJson(url, body) {
  return new Promise((resolve, reject) => {
    const data  = JSON.stringify(body);
    const parsed = new URL(url);
    const lib   = parsed.protocol === 'https:' ? https : http;
    const opts  = {
      hostname: parsed.hostname,
      port:     parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path:     parsed.pathname,
      method:   'POST',
      headers:  {
        'Content-Type':      'application/json',
        'Content-Length':    Buffer.byteLength(data),
        'x-internal-secret': INTERNAL_SECRET,
      },
    };
    const req = lib.request(opts, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const startOfDay = new Date(TARGET_DATE + 'T00:00:00+07:00');
  const endOfDay   = new Date(TARGET_DATE + 'T23:59:59+07:00');

  console.log(`\n📅 Backfill affiliate cho ngày: ${TARGET_DATE}`);
  console.log(`   Range: ${startOfDay.toISOString()} → ${endOfDay.toISOString()}`);
  console.log(`   API:   ${API_URL}\n`);

  // Query Firestore orders trong ngày
  const snap = await db.collection('orders')
    .where('status', '==', 'PAID')
    .where('createdAt', '>=', startOfDay)
    .where('createdAt', '<=', endOfDay)
    .get();

  console.log(`🔍 Tìm thấy ${snap.size} orders PAID trong ngày`);

  const withRef    = snap.docs.filter(d => d.data().referralCode);
  const withoutRef = snap.docs.filter(d => !d.data().referralCode);

  console.log(`   ├─ Có referralCode: ${withRef.length}`);
  console.log(`   └─ Không có:        ${withoutRef.length}\n`);

  if (withRef.length === 0) {
    console.log('✅ Không có order nào cần sync affiliate hôm nay.');
    return;
  }

  let synced  = 0;
  let skipped = 0;
  let errors  = 0;

  for (const doc of withRef) {
    const data = doc.data();
    const oc   = doc.id;
    const ref  = data.referralCode;
    const amt  = Number(data.paidAmount ?? data.amount ?? 0);

    process.stdout.write(`  → Order ${oc}  ref=${ref}  amount=${amt} ... `);

    try {
      const result = await postJson(
        `${API_URL}/api/v1/affiliate/internal/sepay-sync`,
        {
          referralCode:  ref,
          amount:        amt,
          customerEmail: data.customerEmail || data.payload?.EMAIL || '',
          customerName:  data.customerName  || data.payload?.HOTEN || '',
          orderCode:     String(oc),
        }
      );

      if (result.status === 200 || result.status === 201) {
        const msg = result.body?.message ?? '';
        if (msg === 'Already synced') {
          console.log(`⚡ Already synced`);
          skipped++;
        } else {
          console.log(`✅ ${msg}`);
          synced++;
        }
      } else {
        console.log(`⚠️  HTTP ${result.status}: ${JSON.stringify(result.body)}`);
        errors++;
      }
    } catch (err) {
      console.log(`❌ ${err.message}`);
      errors++;
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 Kết quả backfill ngày ${TARGET_DATE}:`);
  console.log(`   ✅ Synced mới:  ${synced}`);
  console.log(`   ⚡ Đã có sẵn:   ${skipped}`);
  console.log(`   ❌ Lỗi:         ${errors}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
