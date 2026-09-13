/**
 * check-order-ref.js
 * Tìm referralCode của một order cụ thể trong Firestore
 * Chạy: node check-order-ref.js NCN4853
 */

require('dotenv').config({ path: '.env.firebase-local' });

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountRaw) {
  console.error('❌ Thiếu FIREBASE_SERVICE_ACCOUNT trong .env.firebase-local');
  process.exit(1);
}

const serviceAccount = JSON.parse(serviceAccountRaw);
if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

async function main() {
  const orderId = process.argv[2] || 'NCN4853';

  console.log(`\n🔍 Đang tìm order: ${orderId}\n`);

  // Tìm trực tiếp bằng document ID
  const docRef = db.collection('orders').doc(orderId);
  const docSnap = await docRef.get();

  if (docSnap.exists) {
    const data = docSnap.data();
    console.log('✅ Tìm thấy order:');
    console.log(`   Order ID:      ${docSnap.id}`);
    console.log(`   referralCode:  ${data.referralCode || '(không có)'}`);
    console.log(`   Status:        ${data.status}`);
    console.log(`   Amount:        ${data.amount || data.paidAmount}`);
    console.log(`   Customer:      ${data.customerName || data.payload?.HOTEN || '?'}`);
    console.log(`   Email:         ${data.customerEmail || data.payload?.EMAIL || '?'}`);
    console.log(`   CreatedAt:     ${data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt}`);
    return;
  }

  // Nếu không tìm thấy bằng ID, thử query theo orderCode field
  console.log('⚠️  Không tìm thấy bằng document ID, thử query theo field orderCode...\n');
  const snap = await db.collection('orders').where('orderCode', '==', orderId).get();
  if (!snap.empty) {
    snap.forEach(doc => {
      const data = doc.data();
      console.log('✅ Tìm thấy order (qua orderCode field):');
      console.log(`   Doc ID:        ${doc.id}`);
      console.log(`   referralCode:  ${data.referralCode || '(không có)'}`);
      console.log(`   Status:        ${data.status}`);
      console.log(`   Amount:        ${data.amount || data.paidAmount}`);
      console.log(`   Customer:      ${data.customerName || data.payload?.HOTEN || '?'}`);
      console.log(`   Email:         ${data.customerEmail || data.payload?.EMAIL || '?'}`);
      console.log(`   CreatedAt:     ${data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt}`);
    });
    return;
  }

  console.log(`❌ Không tìm thấy order nào với ID/orderCode = ${orderId}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
