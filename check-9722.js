/**
 * check-9722.js - Kiểm tra đơn hàng NCN9722
 */
require('dotenv').config({ path: 'apps/web/.env' });

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountRaw) {
  console.error('❌ Thiếu FIREBASE_SERVICE_ACCOUNT');
  process.exit(1);
}

const serviceAccount = JSON.parse(serviceAccountRaw);
if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

async function main() {
  const orderId = 'NCN9722';
  console.log(`\n🔍 Đang tìm order: ${orderId}\n`);

  // Thử doc ID trực tiếp
  const docRef = db.collection('orders').doc(orderId);
  const docSnap = await docRef.get();

  if (docSnap.exists) {
    const data = docSnap.data();
    console.log('✅ Tìm thấy order (doc ID):');
    console.log('   Order ID:      ', docSnap.id);
    console.log('   referralCode:  ', data.referralCode || '(không có)');
    console.log('   status:        ', data.status);
    console.log('   amount:        ', data.amount || data.paidAmount);
    console.log('   customerName:  ', data.customerName || data.payload?.HOTEN || '?');
    console.log('   customerEmail: ', data.customerEmail || data.payload?.EMAIL || '?');
    console.log('   productType:   ', data.productType || data.payload?.PRODUCT_TYPE);
    console.log('   createdAt:     ', data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt);
    console.log('   paidAt:        ', data.paidAt?.toDate?.()?.toISOString?.() || data.paidAt);
    return;
  }

  // Thử query theo orderCode string
  const snap = await db.collection('orders').where('orderCode', '==', orderId).limit(3).get();
  if (!snap.empty) {
    snap.forEach(doc => {
      const data = doc.data();
      console.log('✅ Tìm thấy (orderCode field string):');
      console.log('   Doc ID:        ', doc.id);
      console.log('   referralCode:  ', data.referralCode || '(không có)');
      console.log('   status:        ', data.status);
      console.log('   amount:        ', data.amount || data.paidAmount);
      console.log('   customerName:  ', data.customerName || data.payload?.HOTEN || '?');
      console.log('   customerEmail: ', data.customerEmail || data.payload?.EMAIL || '?');
    });
    return;
  }

  // Thử query theo orderCode number
  const snap2 = await db.collection('orders').where('orderCode', '==', 9722).limit(3).get();
  if (!snap2.empty) {
    snap2.forEach(doc => {
      const data = doc.data();
      console.log('✅ Tìm thấy (orderCode field number):');
      console.log('   Doc ID:        ', doc.id);
      console.log('   referralCode:  ', data.referralCode || '(không có)');
      console.log('   status:        ', data.status);
      console.log('   amount:        ', data.amount || data.paidAmount);
      console.log('   customerName:  ', data.customerName || data.payload?.HOTEN || '?');
      console.log('   customerEmail: ', data.customerEmail || data.payload?.EMAIL || '?');
    });
    return;
  }

  console.log(`❌ Không tìm thấy order nào với ID/orderCode = ${orderId}`);
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
