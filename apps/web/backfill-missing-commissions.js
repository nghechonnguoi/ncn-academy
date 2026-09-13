require('dotenv').config({ path: require('path').resolve(__dirname, '.env.local') });

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

const MISSING = [
  { orderId: '4853', referralCode: 'TRAN686' },
  { orderId: '9546', referralCode: 'TRANG14' },
  { orderId: '4362', referralCode: 'VAN418'  },
  { orderId: '7879', referralCode: 'VAN418'  },
];

const COMMISSION_RATE = 0.20;

async function backfill() {
  console.log('='.repeat(60));
  console.log('✍️  BACKFILL COMMISSION CHO 4 ĐƠN CÒN THIẾU');
  console.log('='.repeat(60));

  for (const { orderId, referralCode } of MISSING) {
    console.log(`\n📦 Đơn ${orderId} → ${referralCode}`);

    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) { console.log('  ❌ Không tìm thấy đơn!'); continue; }

    const o = orderDoc.data();
    const paidAmount = Number(o.paidAmount || o.amount || 0);
    const commissionAmount = Math.round(paidAmount * COMMISSION_RATE);
    const commId = `manual-${orderId}`;

    console.log(`  Khách:      ${o.customerName}`);
    console.log(`  Số tiền:    ${paidAmount.toLocaleString('vi-VN')}đ`);
    console.log(`  Commission: ${commissionAmount.toLocaleString('vi-VN')}đ (20%)`);

    const existing = await db.collection('affiliate_commissions').doc(commId).get();
    if (existing.exists) { console.log(`  ⚠️  Đã tồn tại, bỏ qua.`); continue; }

    await db.collection('affiliate_commissions').doc(commId).set({
      referralCode,
      orderCode:        orderId,
      amount:           paidAmount,
      commissionAmount,
      commissionRate:   COMMISSION_RATE,
      customerEmail:    o.customerEmail || o.payload?.EMAIL || '',
      customerName:     o.customerName  || o.payload?.HOTEN || '',
      status:           'PENDING',
      source:           'manual_backfill',
      note:             `Backfill thiếu — phát hiện qua audit 01/09/2026`,
      createdAt:        FieldValue.serverTimestamp(),
    });

    // Cập nhật referralCode vào order nếu không khớp
    if ((o.referralCode || '').toUpperCase() !== referralCode) {
      await db.collection('orders').doc(orderId).update({ referralCode, updatedAt: FieldValue.serverTimestamp() });
      console.log(`  ✅ Cập nhật referralCode order → ${referralCode}`);
    }

    console.log(`  ✅ Ghi commission thành công! (${commissionAmount.toLocaleString('vi-VN')}đ → ${referralCode})`);
  }

  // Tổng kết từng mã sau backfill
  console.log('\n' + '='.repeat(60));
  console.log('📊 KẾT QUẢ SAU BACKFILL:');

  for (const ref of ['TRAN686', 'TRANG14', 'VAN418']) {
    const snap = await db.collection('affiliate_commissions').where('referralCode', '==', ref).get();
    let total = 0;
    snap.forEach(d => total += Number(d.data().commissionAmount || 0));
    console.log(`\n  [${ref}] ${snap.size} commission | Tổng: ${total.toLocaleString('vi-VN')} VNĐ`);
    snap.forEach(d => {
      const c = d.data();
      console.log(`    • Đơn ${c.orderCode} | ${Number(c.commissionAmount).toLocaleString('vi-VN')}đ | ${c.status}`);
    });
  }

  console.log('\n' + '='.repeat(60));
  process.exit(0);
}

backfill().catch(e => { console.error('❌', e.message); process.exit(1); });
