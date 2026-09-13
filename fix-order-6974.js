/**
 * fix-order-6974.js
 * Fix đơn hàng NCN6974 (Nguyễn Thị Huỳnh Như):
 *   1. Cập nhật status PENDING → PAID
 *   2. Ghi referralCode = TRAN686
 *   3. Ghi commission cho TRAN686 (20% × 568,000 = 113,600 VNĐ)
 *
 * Chạy: node fix-order-6974.js
 */

require('dotenv').config({ path: '.env.firebase-local' });

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

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

const ORDER_CODE   = '6974';
const REFERRAL_CODE = 'TRAN686';
const PAID_AMOUNT  = 568000;
const COMMISSION_RATE = 0.20;
const COMMISSION_AMOUNT = Math.round(PAID_AMOUNT * COMMISSION_RATE); // 113,600

async function main() {
  console.log('\n🔧 FIX ĐƠN HÀNG NCN6974 (Nguyễn Thị Huỳnh Như)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // ─── Bước 1: Đọc trạng thái hiện tại ──────────────────────────────────
  console.log('📖 Bước 1: Đọc trạng thái hiện tại...');
  const docRef = db.collection('orders').doc(ORDER_CODE);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    console.error(`❌ Không tìm thấy order ${ORDER_CODE} trong Firestore!`);
    process.exit(1);
  }

  const data = docSnap.data();
  console.log(`  status hiện tại:   ${data.status}`);
  console.log(`  pdfDone:           ${data.pdfDone}`);
  console.log(`  paidAmount:        ${data.paidAmount}`);
  console.log(`  referralCode:      ${data.referralCode || '(trống)'}`);
  console.log(`  customerName:      ${data.customerName || data.payload?.HOTEN}`);
  console.log(`  customerEmail:     ${data.customerEmail || data.payload?.EMAIL}\n`);

  // ─── Bước 2: Cập nhật status → PAID + ghi referralCode ────────────────
  console.log('📝 Bước 2: Cập nhật Firestore order...');
  await docRef.set({
    status:       'PAID',
    referralCode: REFERRAL_CODE,
    updatedAt:    FieldValue.serverTimestamp(),
    fixNote:      `Manual fix by admin on ${new Date().toISOString()} — TRAN686 commission added`,
  }, { merge: true });

  console.log('  ✅ status      → PAID');
  console.log(`  ✅ referralCode → ${REFERRAL_CODE}\n`);

  // ─── Bước 3: Ghi commission cho TRAN686 ───────────────────────────────
  console.log(`💰 Bước 3: Ghi commission cho ${REFERRAL_CODE}...`);
  const commissionId  = `sepay-${ORDER_CODE}`;
  const commissionRef = db.collection('affiliate_commissions').doc(commissionId);
  const existing = await commissionRef.get();

  if (existing.exists) {
    console.log(`  ⚠️  Commission ${commissionId} đã tồn tại:`);
    const ed = existing.data();
    console.log(`     referralCode: ${ed.referralCode} | amount: ${ed.amount} | status: ${ed.status}`);
    console.log(`  → Cập nhật referralCode → ${REFERRAL_CODE} (nếu khác)`);
    if (ed.referralCode !== REFERRAL_CODE) {
      await commissionRef.set({
        referralCode:     REFERRAL_CODE,
        updatedAt:        FieldValue.serverTimestamp(),
      }, { merge: true });
      console.log(`  ✅ referralCode đã cập nhật → ${REFERRAL_CODE}`);
    } else {
      console.log(`  ✅ referralCode đã đúng (${REFERRAL_CODE}), không cần sửa`);
    }
  } else {
    await commissionRef.set({
      referralCode:     REFERRAL_CODE,
      orderCode:        ORDER_CODE,
      amount:           PAID_AMOUNT,
      commissionAmount: COMMISSION_AMOUNT,
      commissionRate:   COMMISSION_RATE,
      customerEmail:    data.customerEmail || data.payload?.EMAIL || '',
      customerName:     data.customerName  || data.payload?.HOTEN || '',
      status:           'PENDING',
      source:           'manual_fix',
      createdAt:        FieldValue.serverTimestamp(),
    });
    console.log(`  ✅ Commission ghi nhận thành công:`);
    console.log(`     ID:         ${commissionId}`);
    console.log(`     Ref:        ${REFERRAL_CODE}`);
    console.log(`     Tiền TT:    ${PAID_AMOUNT.toLocaleString('vi-VN')} VNĐ`);
    console.log(`     Commission: ${COMMISSION_AMOUNT.toLocaleString('vi-VN')} VNĐ (20%)`);
  }

  // ─── Kết quả ────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 HOÀN THÀNH! Đơn hàng NCN6974 đã được cập nhật:');
  console.log('   • status: PAID');
  console.log(`   • referralCode: ${REFERRAL_CODE}`);
  console.log(`   • commission: ${COMMISSION_AMOUNT.toLocaleString('vi-VN')} VNĐ → TRAN686`);
  console.log('   • PDF đã có sẵn (pdfDone = true)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
