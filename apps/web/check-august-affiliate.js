require('dotenv').config({ path: require('path').resolve(__dirname, '.env.local') });

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

async function checkAugustAffiliate() {
  const AUG_START = new Date('2026-08-01T00:00:00+07:00');
  const AUG_END   = new Date('2026-08-31T23:59:59+07:00');

  console.log('='.repeat(65));
  console.log('📊 THÀNH TÍCH AFFILIATE THÁNG 8/2026');
  console.log('='.repeat(65));

  // 1. Tất cả commission trong tháng 8
  const snap = await db.collection('affiliate_commissions')
    .orderBy('createdAt', 'asc')
    .get();

  const allComm = [];
  snap.forEach(d => {
    const c = { id: d.id, ...d.data() };
    const ts = c.createdAt?.toDate?.();
    if (ts && ts >= AUG_START && ts <= AUG_END) {
      allComm.push(c);
    }
  });

  console.log(`\nTổng commission tháng 8: ${allComm.length} đơn\n`);

  // 2. Group theo referralCode
  const byRef = {};
  for (const c of allComm) {
    const ref = c.referralCode || '(không có mã)';
    if (!byRef[ref]) byRef[ref] = { count: 0, totalOrder: 0, totalComm: 0, orders: [] };
    byRef[ref].count++;
    byRef[ref].totalOrder += Number(c.amount || 0);
    byRef[ref].totalComm  += Number(c.commissionAmount || 0);
    byRef[ref].orders.push({
      orderCode: c.orderCode,
      amount: c.amount,
      commission: c.commissionAmount,
      status: c.status,
      date: c.createdAt?.toDate?.()?.toLocaleDateString('vi-VN'),
      customer: c.customerName || '—',
    });
  }

  // 3. In kết quả theo từng mã
  console.log('─'.repeat(65));
  for (const [ref, data] of Object.entries(byRef).sort((a, b) => b[1].totalComm - a[1].totalComm)) {
    console.log(`\n🏷️  MÃ: ${ref}`);
    console.log(`   Số đơn:       ${data.count}`);
    console.log(`   Doanh thu:    ${data.totalOrder.toLocaleString('vi-VN')} VNĐ`);
    console.log(`   Hoa hồng 20%: ${data.totalComm.toLocaleString('vi-VN')} VNĐ`);
    console.log(`   Chi tiết:`);
    data.orders.forEach(o => {
      console.log(`     • Đơn ${o.orderCode} | ${o.amount?.toLocaleString('vi-VN')}đ | commission: ${o.commission?.toLocaleString('vi-VN')}đ | ${o.status} | ${o.date} | ${o.customer}`);
    });
  }

  // 4. Kiểm tra orders tháng 8 không có commission
  console.log('\n' + '='.repeat(65));
  console.log('⚠️  ĐƠN THÁNG 8 PAID NHƯNG KHÔNG CÓ COMMISSION:');
  const ordersSnap = await db.collection('orders').get();

  let missingCount = 0;
  for (const d of ordersSnap.docs) {
    const o = d.data();
    if (o.status !== 'PAID') continue;
    const paidAt = o.paidAt?.toDate?.();
    if (!paidAt || paidAt < AUG_START || paidAt > AUG_END) continue;
    if (!o.referralCode) continue; // đơn không có ref thì bỏ qua

    // Kiểm tra có commission không
    const commExists = allComm.some(c => String(c.orderCode) === String(d.id));
    if (!commExists) {
      missingCount++;
      console.log(`  ❌ Đơn ${d.id} | ${o.paidAmount?.toLocaleString('vi-VN')}đ | ref="${o.referralCode}" | ${paidAt.toLocaleDateString('vi-VN')} | ${o.customerName}`);
    }
  }
  if (missingCount === 0) console.log('  ✅ Tất cả đơn có referralCode đều đã được ghi commission');

  // 5. Tổng tháng 8
  const totalOrder = allComm.reduce((s, c) => s + Number(c.amount || 0), 0);
  const totalComm  = allComm.reduce((s, c) => s + Number(c.commissionAmount || 0), 0);
  console.log('\n' + '='.repeat(65));
  console.log('📈 TỔNG KẾT THÁNG 8:');
  console.log(`  Tổng đơn affiliate: ${allComm.length}`);
  console.log(`  Tổng doanh thu:     ${totalOrder.toLocaleString('vi-VN')} VNĐ`);
  console.log(`  Tổng hoa hồng:      ${totalComm.toLocaleString('vi-VN')} VNĐ`);
  console.log('='.repeat(65));

  process.exit(0);
}

checkAugustAffiliate().catch(e => { console.error('❌', e.message); process.exit(1); });
