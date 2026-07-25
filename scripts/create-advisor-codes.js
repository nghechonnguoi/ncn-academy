/**
 * Script tạo mã tư vấn viên (advisor codes) cho NCN Academy.
 * Chạy từ thư mục gốc: node scripts/create-advisor-codes.js
 * Hoặc từ apps/web:    node ../../scripts/create-advisor-codes.js
 *
 * Yêu cầu: firebase-admin phải có trong node_modules (hoặc apps/web/node_modules)
 */

const fs   = require('fs');
const path = require('path');

// ============================================
// CẤU HÌNH — SỬA PHẦN NÀY MỖI LẦN TẠO MÃ
// ============================================
const CONFIG = {
  prefix: 'NCN-PN',                                     // Prefix cho tư vấn viên
  quantity: 10,                                          // Số lượng mã cần tạo
  advisorName: 'Phạm Ngàn',                             // Tên tư vấn viên
  advisorEmail: 'tuvanhuongnghiepchonnghe@gmail.com',   // Email nhận báo cáo
  advisorPhone: '0986864591',                            // SĐT tư vấn viên
};
// ============================================

// Đọc FIREBASE_SERVICE_ACCOUNT từ .env.local (apps/web)
function loadEnv() {
  // Thử nhiều vị trí env file
  const candidates = [
    path.join(__dirname, '..', 'apps', 'web', '.env.local'),
    path.join(__dirname, '..', 'apps', 'web', '.env'),
    path.join(process.cwd(), '.env.local'),
    path.join(process.cwd(), '.env'),
  ];
  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const lines = content.split('\n');
      for (const line of lines) {
        const eq = line.indexOf('=');
        if (eq > 0 && !line.trim().startsWith('#')) {
          const key = line.slice(0, eq).trim();
          const val = line.slice(eq + 1).trim().replace(/^"([\s\S]*)"$/, '$1').replace(/^'([\s\S]*)'$/, '$1');
          if (!process.env[key]) process.env[key] = val;
        }
      }
      console.log(`📁 Loaded env from: ${envPath}`);
      return;
    }
  }
  console.warn('⚠️  Không tìm thấy .env.local — cần có FIREBASE_SERVICE_ACCOUNT trong env');
}

loadEnv();

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT chưa được set trong env');
  process.exit(1);
}

// Khởi tạo Firebase Admin SDK (dùng require để Node.js tự tìm node_modules)
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue }     = require('firebase-admin/firestore');

if (!getApps().length) {
  const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  initializeApp({ credential: cert(sa) });
}

const db = getFirestore();

// Sinh mã: prefix + 3 ký tự (chữ hoa + số, bỏ ký tự dễ nhầm)
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

  // Kiểm tra trùng mã với coupon đã có
  const existingCodes = new Set();
  const snapshot = await db.collection('coupons').get();
  snapshot.forEach(doc => existingCodes.add(doc.id));

  const batch = db.batch();
  const codes = [];

  for (let i = 0; i < quantity; i++) {
    let code;
    let attempts = 0;
    do {
      code = generateCode(prefix);
      attempts++;
      if (attempts > 1000) throw new Error('Quá nhiều mã trùng — thử prefix khác');
    } while (existingCodes.has(code) || codes.includes(code));

    codes.push(code);

    const ref = db.collection('coupons').doc(code);
    batch.set(ref, {
      code:           code,
      discountAmount: 0,       // Miễn phí 100%
      active:         true,
      isAdmin:        true,
      usedBy:         null,
      usedAt:         null,
      createdAt:      FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();

  // Lưu mapping prefix → thông tin tư vấn viên
  const prefixRef = db.doc('config/advisorPrefixes');
  await prefixRef.set(
    {
      [prefix]: {
        name:  advisorName,
        email: advisorEmail,
        phone: advisorPhone || '',
      },
    },
    { merge: true }
  );

  console.log('\n========================================');
  console.log(`✅ Đã tạo ${codes.length} mã cho ${advisorName}`);
  console.log(`📧 Email nhận báo cáo: ${advisorEmail}`);
  console.log(`📱 SĐT: ${advisorPhone || '(chưa có)'}`);
  console.log(`🔑 Prefix: ${prefix}`);
  console.log('========================================');
  console.log('📋 Danh sách mã:');
  codes.forEach((c, i) => console.log(`  ${i + 1}. ${c}`));
  console.log('========================================');
  console.log('👉 Copy danh sách mã gửi cho tư vấn viên.\n');

  process.exit(0);
}

createAdvisorCodes().catch(err => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});
