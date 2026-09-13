require('dotenv').config({ path: require('path').resolve(__dirname, '.env.local') });

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

const REFERRAL_CODE = 'TRAN686';
const COMMISSION_RATE = 0.20;
const ORDER_IDS = ['3520', '9722'];

async function run() {
  console.log('='.repeat(60));
  console.log(`✍️  GHI COMMISSION CHO ${REFERRAL_CODE}`);
  console.log(`   Đơn: ${ORDER_IDS.join(', ')}`);
  console.log('='.repeat(60));

  for (const orderId of ORDER_IDS) {
    console.log(`\n📦 Xử lý đơn ${orderId}...`);

    // 1. Lấy thông tin đơn
    const orderDoc = await db.collection('orders').doc(orderId).get();
    if (!orderDoc.exists) {
      console.log(`  ❌ Đơn ${orderId} không tồn tại!`);
      continue;
    }
    const order = orderDoc.data();
    const paidAmount = Number(order.paidAmount || order.amount || 0);
    const commissionAmount = Math.round(paidAmount * COMMISSION_RATE);

    console.log(`  Khách:      ${order.customerName || order.payload?.HOTEN}`);
    console.log(`  Email:      ${order.customerEmail || order.payload?.EMAIL}`);
    console.log(`  Trạng thái: ${order.status}`);
    console.log(`  Số tiền:    ${paidAmount.toLocaleString('vi-VN')} VNĐ`);
    console.log(`  Commission: ${commissionAmount.toLocaleString('vi-VN')} VNĐ (20%)`);

    if (order.status !== 'PAID') {
      console.log(`  ⚠️  Đơn chưa PAID (status=${order.status}), bỏ qua!`);
      continue;
    }

    // 2. Kiểm tra commission đã tồn tại chưa
    const commId = `manual-${orderId}`;
    const commRef = db.collection('affiliate_commissions').doc(commId);
    const existing = await commRef.get();
    if (existing.exists) {
      console.log(`  ⚠️  Commission ${commId} đã tồn tại:`, existing.data());
      continue;
    }

    // 3. Ghi commission
    await commRef.set({
      referralCode:     REFERRAL_CODE,
      orderCode:        orderId,
      amount:           paidAmount,
      commissionAmount: commissionAmount,
      commissionRate:   COMMISSION_RATE,
      customerEmail:    order.customerEmail || order.payload?.EMAIL || '',
      customerName:     order.customerName  || order.payload?.HOTEN || '',
      status:           'PENDING',
      source:           'manual_admin',
      note:             `Ghi nhận thủ công — khách từ link affiliate TRAN686`,
      createdAt:        FieldValue.serverTimestamp(),
    });

    // 4. Cập nhật referralCode vào order nếu chưa có
    if (!order.referralCode) {
      await db.collection('orders').doc(orderId).update({
        referralCode: REFERRAL_CODE,
        updatedAt: FieldValue.serverTimestamp(),
      });
      console.log(`  ✅ Đã cập nhật referralCode vào order`);
    }

    console.log(`  ✅ Commission ghi nhận thành công! (ID: ${commId})`);
    console.log(`     ${paidAmount.toLocaleString('vi-VN')}đ × 20% = ${commissionAmount.toLocaleString('vi-VN')}đ → ${REFERRAL_CODE}`);
  }

  // Tổng kết
  console.log('\n' + '='.repeat(60));
  console.log('📊 KIỂM TRA SAU KHI GHI:');
  const snap = await db.collection('affiliate_commissions')
    .where('referralCode', '==', REFERRAL_CODE)
    .get();
  let total = 0;
  snap.forEach(d => {
    const c = d.data();
    total += Number(c.commissionAmount || 0);
    console.log(`  [${d.id}] đơn=${c.orderCode} amt=${Number(c.amount).toLocaleString('vi-VN')}đ comm=${Number(c.commissionAmount).toLocaleString('vi-VN')}đ status=${c.status}`);
  });
  console.log(`\n  💰 Tổng hoa hồng TRAN686: ${total.toLocaleString('vi-VN')} VNĐ`);
  console.log('='.repeat(60));

  process.exit(0);
}

run().catch(e => { console.error('❌', e.message); process.exit(1); });
