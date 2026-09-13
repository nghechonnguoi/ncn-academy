require('dotenv').config({ path: require('path').resolve(__dirname, '.env.local') });

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();

async function checkOrder3520() {
  const ORDER_ID = '3520';
  console.log('='.repeat(60));
  console.log(`🔍 KIỂM TRA ĐƠN HÀNG NCN ${ORDER_ID}`);
  console.log('='.repeat(60));

  // 1. Check đơn hàng
  const doc = await db.collection('orders').doc(ORDER_ID).get();
  if (!doc.exists) {
    console.log(`\n❌ Đơn ${ORDER_ID} KHÔNG tồn tại trong Firestore`);
  } else {
    const d = doc.data();
    console.log('\n📦 THÔNG TIN ĐƠN HÀNG:');
    console.log(`  Status:        ${d.status}`);
    console.log(`  Amount:        ${d.amount?.toLocaleString('vi-VN')} VNĐ`);
    console.log(`  PaidAmount:    ${d.paidAmount?.toLocaleString('vi-VN')} VNĐ`);
    console.log(`  referralCode:  ${d.referralCode || '⚠️  KHÔNG CÓ (null/undefined)'}`);
    console.log(`  customerName:  ${d.customerName  || d.payload?.HOTEN}`);
    console.log(`  customerEmail: ${d.customerEmail || d.payload?.EMAIL}`);
    console.log(`  pdfDone:       ${d.pdfDone}`);
    console.log(`  paidAt:        ${d.paidAt?.toDate?.()}`);
    console.log(`  createdAt:     ${d.createdAt?.toDate?.()}`);

    // Kiểm tra source URL trong payload
    const p = d.payload || {};
    console.log('\n🔗 NGUỒN LINK / PAYLOAD:');
    console.log(`  REF/referral:  ${p.REF || p.ref || p.referral || p.REFERRAL || '(không có)'}`);
    console.log(`  SOURCE:        ${p.SOURCE || p.source || '(không có)'}`);
    console.log(`  UTM_SOURCE:    ${p.utm_source || p.UTM_SOURCE || '(không có)'}`);
    console.log(`  FULL keys:     ${Object.keys(p).join(', ')}`);
  }

  // 2. Check affiliate commission
  console.log('\n' + '='.repeat(60));
  console.log('💰 KIỂM TRA AFFILIATE COMMISSION:');
  const commId = `sepay-${ORDER_ID}`;
  const commDoc = await db.collection('affiliate_commissions').doc(commId).get();
  if (commDoc.exists) {
    const c = commDoc.data();
    console.log(`  ✅ Commission tồn tại (ID: ${commId})`);
    console.log(`  referralCode:     ${c.referralCode}`);
    console.log(`  amount:           ${c.amount?.toLocaleString('vi-VN')} VNĐ`);
    console.log(`  commissionAmount: ${c.commissionAmount?.toLocaleString('vi-VN')} VNĐ`);
    console.log(`  status:           ${c.status}`);
    console.log(`  source:           ${c.source}`);
    console.log(`  createdAt:        ${c.createdAt?.toDate?.()}`);
  } else {
    console.log(`  ❌ KHÔNG có commission (doc ID: ${commId})`);

    // Tìm theo orderCode string
    const snap = await db.collection('affiliate_commissions')
      .where('orderCode', '==', ORDER_ID).get();
    if (!snap.empty) {
      snap.forEach(d => {
        console.log(`  ℹ️  Tìm thấy commission khác (doc ${d.id}):`, d.data());
      });
    } else {
      console.log('  ❌ Không tìm thấy commission theo orderCode cũng không có');
    }
  }

  // 3. 5 commission gần nhất
  console.log('\n' + '='.repeat(60));
  console.log('📊 5 COMMISSION GẦN NHẤT TRONG HỆ THỐNG:');
  const recentSnap = await db.collection('affiliate_commissions')
    .orderBy('createdAt', 'desc').limit(5).get();
  if (recentSnap.empty) {
    console.log('  (Không có commission nào)');
  } else {
    recentSnap.forEach(d => {
      const c = d.data();
      console.log(`  [${d.id}] ref=${c.referralCode} order=${c.orderCode} amt=${c.amount} commission=${c.commissionAmount} status=${c.status} date=${c.createdAt?.toDate?.()?.toLocaleDateString('vi-VN')}`);
    });
  }

  process.exit(0);
}

checkOrder3520().catch(e => { console.error('❌ LỖI:', e.message); process.exit(1); });
