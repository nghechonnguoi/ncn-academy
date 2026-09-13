/**
 * Kiểm tra order NCN9722 qua Firebase Admin SDK
 * Dùng FIREBASE_SERVICE_ACCOUNT từ apps/web/.env.local
 */
require('dotenv').config({ path: '.env.local' });
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountRaw) {
  console.error('❌ Thiếu FIREBASE_SERVICE_ACCOUNT trong .env.local');
  process.exit(1);
}

const serviceAccount = JSON.parse(serviceAccountRaw);
if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

async function main() {
  const orderId = 'NCN9722';
  console.log(`\n🔍 Tra cứu đơn hàng: ${orderId}\n`);

  // Thử doc ID trực tiếp
  const docSnap = await db.collection('orders').doc(orderId).get();
  if (docSnap.exists) {
    const data = docSnap.data();
    console.log('✅ Tìm thấy order:');
    console.log('   Order ID:      ', docSnap.id);
    console.log('   referralCode:  ', data.referralCode || '(không có)');
    console.log('   status:        ', data.status);
    console.log('   amount:        ', data.amount || data.paidAmount);
    console.log('   customerName:  ', data.customerName || data.payload?.HOTEN || '?');
    console.log('   customerEmail: ', data.customerEmail || data.payload?.EMAIL || '?');
    console.log('   productType:   ', data.productType || data.payload?.PRODUCT_TYPE);
    console.log('   pdfDone:       ', data.pdfDone);
    console.log('   createdAt:     ', data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt);
    console.log('   paidAt:        ', data.paidAt?.toDate?.()?.toISOString?.() || data.paidAt);
    return;
  }

  console.log('⚠️  Không tìm thấy doc ID "NCN9722", thử query orderCode...');

  // Query orderCode string
  let snap = await db.collection('orders').where('orderCode', '==', 'NCN9722').limit(3).get();
  if (!snap.empty) {
    snap.forEach(doc => {
      const d = doc.data();
      console.log('✅ Tìm thấy (orderCode string):', doc.id);
      console.log('   referralCode:', d.referralCode || '(không có)');
      console.log('   status:', d.status);
      console.log('   customerName:', d.customerName || d.payload?.HOTEN);
    });
    return;
  }

  // Query orderCode number
  snap = await db.collection('orders').where('orderCode', '==', 9722).limit(3).get();
  if (!snap.empty) {
    snap.forEach(doc => {
      const d = doc.data();
      console.log('✅ Tìm thấy (orderCode number):', doc.id);
      console.log('   referralCode:', d.referralCode || '(không có)');
      console.log('   status:', d.status);
      console.log('   customerName:', d.customerName || d.payload?.HOTEN);
    });
    return;
  }

  console.log('❌ Không tìm thấy order NCN9722 trong Firestore');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
