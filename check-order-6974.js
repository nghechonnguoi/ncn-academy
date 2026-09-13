/**
 * check-order-6974.js
 * Kiểm tra trạng thái đơn hàng NCN6974 trong Firestore
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

async function check() {
  console.log('\n🔍 Kiểm tra đơn hàng NCN6974 (mã TRAN686)\n');

  // Thử tìm bằng doc ID '6974'
  const doc1 = await db.collection('orders').doc('6974').get();
  if (doc1.exists) {
    const d = doc1.data();
    console.log('=== ✅ TÌM THẤY (doc ID: 6974) ===');
    console.log('status:           ', d.status);
    console.log('pdfDone:          ', d.pdfDone);
    console.log('pdfGenerating:    ', d.pdfGenerating);
    console.log('aiGenerationFailed:', d.aiGenerationFailed);
    console.log('aiErrorDetail:    ', d.aiErrorDetail);
    console.log('amount:           ', d.amount);
    console.log('paidAmount:       ', d.paidAmount);
    console.log('referralCode:     ', d.referralCode);
    console.log('customerName:     ', d.customerName || d.payload?.HOTEN);
    console.log('customerEmail:    ', d.customerEmail || d.payload?.EMAIL);
    console.log('createdAt:        ', d.createdAt?.toDate?.()?.toISOString?.() || d.createdAt);
    console.log('paidAt:           ', d.paidAt?.toDate?.()?.toISOString?.() || d.paidAt);
    console.log('productType:      ', d.productType || d.payload?.PRODUCT_TYPE);
    console.log('sepayData present:', !!d.sepayData);
    return;
  }

  // Thử query theo orderCode field (number)
  const snap = await db.collection('orders').where('orderCode', '==', 6974).limit(3).get();
  if (!snap.empty) {
    snap.forEach(doc => {
      const d = doc.data();
      console.log('=== ✅ TÌM THẤY (orderCode field = 6974) ===');
      console.log('doc ID:           ', doc.id);
      console.log('status:           ', d.status);
      console.log('pdfDone:          ', d.pdfDone);
      console.log('pdfGenerating:    ', d.pdfGenerating);
      console.log('aiGenerationFailed:', d.aiGenerationFailed);
      console.log('amount:           ', d.amount);
      console.log('referralCode:     ', d.referralCode);
      console.log('customerName:     ', d.customerName || d.payload?.HOTEN);
      console.log('customerEmail:    ', d.customerEmail || d.payload?.EMAIL);
      console.log('createdAt:        ', d.createdAt?.toDate?.()?.toISOString?.() || d.createdAt);
    });
    return;
  }

  // Thử query theo orderCode field (string)
  const snap2 = await db.collection('orders').where('orderCode', '==', '6974').limit(3).get();
  if (!snap2.empty) {
    snap2.forEach(doc => {
      const d = doc.data();
      console.log('=== ✅ TÌM THẤY (orderCode field = "6974") ===');
      console.log('doc ID:           ', doc.id);
      console.log('status:           ', d.status);
      console.log('pdfDone:          ', d.pdfDone);
      console.log('pdfGenerating:    ', d.pdfGenerating);
      console.log('aiGenerationFailed:', d.aiGenerationFailed);
      console.log('amount:           ', d.amount);
      console.log('referralCode:     ', d.referralCode);
      console.log('customerName:     ', d.customerName || d.payload?.HOTEN);
      console.log('customerEmail:    ', d.customerEmail || d.payload?.EMAIL);
      console.log('createdAt:        ', d.createdAt?.toDate?.()?.toISOString?.() || d.createdAt);
    });
    return;
  }

  console.log('❌ Không tìm thấy order NCN6974 trong Firestore bằng bất kỳ phương thức nào');
  console.log('');
  console.log('💡 Có thể:');
  console.log('   1. Đơn hàng chưa được tạo trong hệ thống (chưa có trước khi thanh toán)');
  console.log('   2. Nội dung chuyển khoản không khớp format "NCN 6974"');
  console.log('   3. SePay webhook chưa được gọi hoặc bị lỗi');
  console.log('   4. Mã TRAN686 là referralCode của affiliate, không liên quan đến orderCode');
}

check().catch(e => {
  console.error('Fatal error:', e.message);
  process.exit(1);
});
