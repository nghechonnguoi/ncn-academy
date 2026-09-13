require('dotenv').config({ path: require('path').resolve(__dirname, '.env.local') });

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

async function markAllPaid() {
  console.log('='.repeat(60));
  console.log('💸 CẬP NHẬT TOÀN BỘ COMMISSION → PAID');
  console.log('='.repeat(60));

  const snap = await db.collection('affiliate_commissions')
    .where('status', '==', 'PENDING')
    .get();

  if (snap.empty) {
    console.log('\n✅ Không có commission PENDING nào.');
    process.exit(0);
  }

  console.log(`\nTìm thấy ${snap.size} commission PENDING. Đang cập nhật...\n`);

  const batch = db.batch();
  let total = 0;

  snap.forEach(d => {
    const c = d.data();
    const amt = Number(c.commissionAmount || 0);
    total += amt;
    batch.update(d.ref, {
      status: 'PAID',
      paidAt: FieldValue.serverTimestamp(),
      note: (c.note ? c.note + ' | ' : '') + 'Đã chuyển khoản 01/09/2026',
    });
    console.log(`  ✅ [${c.referralCode}] Đơn ${c.orderCode} | ${amt.toLocaleString('vi-VN')}đ → PAID`);
  });

  await batch.commit();

  console.log('\n' + '='.repeat(60));
  console.log(`💰 Đã đánh dấu PAID: ${snap.size} commission`);
  console.log(`💰 Tổng đã chi:       ${total.toLocaleString('vi-VN')} VNĐ`);

  // Thống kê theo từng mã
  console.log('\n📊 Phân theo mã affiliate:');
  const byRef = {};
  snap.forEach(d => {
    const c = d.data();
    const ref = c.referralCode || '?';
    if (!byRef[ref]) byRef[ref] = 0;
    byRef[ref] += Number(c.commissionAmount || 0);
  });
  for (const [ref, amt] of Object.entries(byRef).sort()) {
    console.log(`  ${ref}: ${amt.toLocaleString('vi-VN')} VNĐ`);
  }
  console.log('='.repeat(60));

  process.exit(0);
}

markAllPaid().catch(e => { console.error('❌', e.message); process.exit(1); });
