const admin = require('firebase-admin');
const path = require('path');

// ============================================
// CẤU HÌNH — SỬA PHẦN NÀY MỖI LẦN TẠO MÃ
// ============================================
const CONFIG = {
  prefix: 'NCN-PN',                                    // Prefix cho tư vấn viên
  quantity: 10,                                         // Số lượng mã cần tạo
  advisorName: 'Phạm Ngàn',                            // Tên tư vấn viên
  advisorEmail: 'tuvanhuongnghiepchonnghe1@gmail.com',  // Email nhận báo cáo
  advisorPhone: '',                                     // SĐT tư vấn viên (để hiển thị cho khách)
};
// ============================================

// Khởi tạo Firebase Admin
if (!admin.apps.length) {
  try {
    const serviceAccount = require('./serviceAccountKey.json');
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } catch (e) {
    // Thử đường dẫn apps/web
    const serviceAccount = require('./apps/web/serviceAccountKey.json');
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }
}

const db = admin.firestore();

function generateCode(prefix) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 3; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}${suffix}`;
}

async function createAdvisorCodes() {
  const { prefix, quantity, advisorName, advisorEmail, advisorPhone } = CONFIG;
  const batch = db.batch();
  const codes = [];

  // Kiểm tra trùng mã
  const existingCodes = new Set();
  const snapshot = await db.collection('coupons').get();
  snapshot.forEach(doc => existingCodes.add(doc.id));

  for (let i = 0; i < quantity; i++) {
    let code;
    do {
      code = generateCode(prefix);
    } while (existingCodes.has(code) || codes.includes(code));

    codes.push(code);

    const ref = db.collection('coupons').doc(code);
    batch.set(ref, {
      code: code,
      discountAmount: 0,         // Miễn phí 100%
      active: true,
      isAdmin: true,
      usedBy: null,
      usedAt: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();

  // Lưu mapping prefix → tư vấn viên
  const prefixRef = db.doc('config/advisorPrefixes');
  await prefixRef.set(
    {
      [prefix]: {
        name: advisorName,
        email: advisorEmail,
        phone: advisorPhone || '',
      },
    },
    { merge: true }
  );

  console.log('========================================');
  console.log(`Đã tạo ${codes.length} mã cho ${advisorName}`);
  console.log(`Email nhận báo cáo: ${advisorEmail}`);
  console.log(`Prefix: ${prefix}`);
  console.log('========================================');
  console.log('Danh sách mã:');
  codes.forEach((code, i) => console.log(`  ${i + 1}. ${code}`));
  console.log('========================================');
  console.log('Copy danh sách mã gửi cho tư vấn viên.');

  process.exit(0);
}

createAdvisorCodes().catch(err => {
  console.error('Lỗi:', err.message);
  process.exit(1);
});
