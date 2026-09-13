require('dotenv').config({ path: require('path').resolve(__dirname, '.env.local') });

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

async function fullAudit() {
  console.log('='.repeat(70));
  console.log('🔍 RÀ SOÁT TOÀN HỆ THỐNG AFFILIATE');
  console.log('='.repeat(70));

  // ── 1. Load toàn bộ orders PAID có referralCode ────────────────────────
  console.log('\n📦 Đang load orders...');
  const ordersSnap = await db.collection('orders').get();
  const paidWithRef = [];
  ordersSnap.forEach(d => {
    const o = d.data();
    if (o.status === 'PAID' && o.referralCode && o.referralCode.trim() !== '') {
      paidWithRef.push({ id: d.id, ...o });
    }
  });
  console.log(`   → ${ordersSnap.size} đơn tổng, ${paidWithRef.length} đơn PAID có referralCode`);

  // ── 2. Load toàn bộ commissions ────────────────────────────────────────
  console.log('\n💰 Đang load commissions...');
  const commSnap = await db.collection('affiliate_commissions').get();
  const commissions = [];
  commSnap.forEach(d => commissions.push({ id: d.id, ...d.data() }));
  console.log(`   → ${commissions.length} commission records tổng`);

  // ── 3. Group orders theo referralCode ──────────────────────────────────
  const byRef = {};
  for (const o of paidWithRef) {
    const ref = o.referralCode.trim().toUpperCase();
    if (!byRef[ref]) byRef[ref] = { orders: [], commissions: [] };
    byRef[ref].orders.push(o);
  }
  for (const c of commissions) {
    const ref = (c.referralCode || '').trim().toUpperCase();
    if (!byRef[ref]) byRef[ref] = { orders: [], commissions: [] };
    byRef[ref].commissions.push(c);
  }

  // ── 4. Phân tích từng affiliate ────────────────────────────────────────
  const allRefs = Object.keys(byRef).sort();
  console.log(`\n   → ${allRefs.length} mã affiliate phát hiện: ${allRefs.join(', ')}`);

  let totalMissing = 0;
  const missingList = [];

  console.log('\n' + '='.repeat(70));
  console.log('📊 CHI TIẾT TỪNG MÃ AFFILIATE:');
  console.log('='.repeat(70));

  for (const ref of allRefs) {
    const { orders, commissions: comms } = byRef[ref];

    // Tính tổng
    const totalOrderAmt  = orders.reduce((s, o) => s + Number(o.paidAmount || o.amount || 0), 0);
    const totalCommAmt   = comms.reduce((s, c) => s + Number(c.commissionAmount || 0), 0);
    const expectedCommAmt = Math.round(totalOrderAmt * 0.20);

    // Tìm đơn thiếu commission
    const missingOrders = orders.filter(o =>
      !comms.some(c => String(c.orderCode) === String(o.id))
    );
    // Tìm commission không có đơn tương ứng (orphan)
    const orphanComms = comms.filter(c =>
      !orders.some(o => String(o.id) === String(c.orderCode))
    );

    const hasIssue = missingOrders.length > 0 || orphanComms.length > 0;
    const icon = hasIssue ? '⚠️ ' : '✅';

    console.log(`\n${icon} [${ref}]`);
    console.log(`   Đơn PAID có ref:  ${orders.length} đơn | ${totalOrderAmt.toLocaleString('vi-VN')}đ`);
    console.log(`   Commission records: ${comms.length} records | ${totalCommAmt.toLocaleString('vi-VN')}đ`);

    if (orders.length > 0) {
      console.log(`   Đơn PAID:`);
      orders.forEach(o => {
        const hasCom = comms.some(c => String(c.orderCode) === String(o.id));
        const paidAt = o.paidAt?.toDate?.()?.toLocaleDateString('vi-VN') || '?';
        console.log(`     ${hasCom ? '✅' : '❌'} Đơn ${o.id} | ${Number(o.paidAmount||o.amount).toLocaleString('vi-VN')}đ | ${paidAt} | ${o.customerName || '?'}`);
        if (!hasCom) {
          missingList.push({ ref, orderId: o.id, amount: Number(o.paidAmount||o.amount), commission: Math.round(Number(o.paidAmount||o.amount)*0.20), customer: o.customerName });
          totalMissing++;
        }
      });
    }

    if (orphanComms.length > 0) {
      console.log(`   ⚠️  Commission không có đơn tương ứng:`);
      orphanComms.forEach(c => {
        console.log(`     [${c.id}] orderCode=${c.orderCode} amt=${Number(c.commissionAmount).toLocaleString('vi-VN')}đ`);
      });
    }
  }

  // ── 5. Tổng kết ────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(70));
  console.log('📈 TỔNG KẾT TOÀN HỆ THỐNG:');
  console.log('='.repeat(70));

  const grandTotalOrder = paidWithRef.reduce((s, o) => s + Number(o.paidAmount||o.amount||0), 0);
  const grandTotalComm  = commissions.reduce((s, c) => s + Number(c.commissionAmount||0), 0);
  const pendingComm     = commissions.filter(c => c.status === 'PENDING').reduce((s, c) => s + Number(c.commissionAmount||0), 0);
  const paidComm        = commissions.filter(c => c.status === 'PAID').reduce((s, c) => s + Number(c.commissionAmount||0), 0);

  console.log(`  Tổng mã affiliate:          ${allRefs.length}`);
  console.log(`  Tổng đơn PAID có ref:       ${paidWithRef.length}`);
  console.log(`  Tổng doanh thu (có ref):    ${grandTotalOrder.toLocaleString('vi-VN')} VNĐ`);
  console.log(`  Tổng commission records:    ${commissions.length}`);
  console.log(`  Tổng hoa hồng (ghi nhận):  ${grandTotalComm.toLocaleString('vi-VN')} VNĐ`);
  console.log(`    ├ PENDING:                ${pendingComm.toLocaleString('vi-VN')} VNĐ`);
  console.log(`    └ PAID:                   ${paidComm.toLocaleString('vi-VN')} VNĐ`);

  if (missingList.length > 0) {
    console.log(`\n⚠️  ĐƠN CÓ REF NHƯNG THIẾU COMMISSION (${missingList.length} đơn):`);
    for (const m of missingList) {
      console.log(`  ❌ [${m.ref}] Đơn ${m.orderId} | ${m.amount.toLocaleString('vi-VN')}đ → commission chưa ghi: ${m.commission.toLocaleString('vi-VN')}đ | ${m.customer}`);
    }
    console.log(`\n  Tổng hoa hồng chưa ghi: ${missingList.reduce((s,m)=>s+m.commission,0).toLocaleString('vi-VN')} VNĐ`);
  } else {
    console.log('\n  ✅ Tất cả đơn có referralCode đều đã được ghi commission!');
  }

  console.log('='.repeat(70));
  process.exit(0);
}

fullAudit().catch(e => { console.error('❌', e.message); process.exit(1); });
