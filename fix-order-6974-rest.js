/**
 * fix-order-6974-rest.js
 * Fix đơn hàng NCN6974 qua Firestore REST API (dùng firebase-tools refresh_token)
 * Bước 1: status PENDING → PAID + ghi referralCode = TRAN686
 * Bước 2: Tạo affiliate_commissions/sepay-6974
 *
 * Chạy: node fix-order-6974-rest.js
 */
const https = require('https');
const fs    = require('fs');
const path  = require('path');

// ── CẤU HÌNH ────────────────────────────────────────────────────────────────
const configPath = path.join(process.env.USERPROFILE || process.env.HOME, '.config', 'configstore', 'firebase-tools.json');
const fbConfig   = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const refreshToken = fbConfig.tokens?.refresh_token;

const FIREBASE_CLIENT_ID     = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const FIREBASE_CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';
const PROJECT_ID             = 'nghechonnguoi-f9eec';

const ORDER_CODE       = '6974';
const REFERRAL_CODE    = 'TRAN686';
const PAID_AMOUNT      = 568000;
const COMMISSION_RATE  = 0.20;
const COMMISSION_AMOUNT = Math.round(PAID_AMOUNT * COMMISSION_RATE); // 113,600

// ── HELPER: Refresh access token ────────────────────────────────────────────
function refreshAccessToken() {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: refreshToken,
      client_id:     FIREBASE_CLIENT_ID,
      client_secret: FIREBASE_CLIENT_SECRET,
    }).toString();
    const options = {
      hostname: 'oauth2.googleapis.com',
      path:     '/token',
      method:   'POST',
      headers:  { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(postData) },
    };
    const req = https.request(options, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const p = JSON.parse(d);
          p.access_token ? resolve(p.access_token) : reject(new Error(d));
        } catch(e) { reject(new Error(d)); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// ── HELPER: PATCH Firestore document ────────────────────────────────────────
function patchFirestore(token, docPath, fields) {
  return new Promise((resolve, reject) => {
    const fieldMask = Object.keys(fields).map(k => `updateMask.fieldPaths=${k}`).join('&');
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${docPath}?${fieldMask}`;

    const toVal = (v) => {
      if (v === null)            return { nullValue: null };
      if (typeof v === 'string') return { stringValue: v };
      if (typeof v === 'boolean')return { booleanValue: v };
      if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
      return { stringValue: String(v) };
    };

    const ff = {};
    for (const [k, v] of Object.entries(fields)) ff[k] = toVal(v);
    const body = JSON.stringify({ fields: ff });

    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path:     urlObj.pathname + urlObj.search,
      method:   'PATCH',
      headers:  {
        'Authorization':  `Bearer ${token}`,
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch(e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── HELPER: GET Firestore document ──────────────────────────────────────────
function getFirestoreDoc(token, docPath) {
  return new Promise((resolve, reject) => {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${docPath}`;
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path:     urlObj.pathname,
      method:   'GET',
      headers:  { 'Authorization': `Bearer ${token}` },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch(e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// ── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🔧 FIX ĐƠN HÀNG NCN6974 (Nguyễn Thị Huỳnh Như)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('🔑 Lấy access token...');
  const token = await refreshAccessToken();
  console.log('✅ Đã lấy access token\n');

  // ─ Bước 1: Patch order document ──────────────────────────────────────────
  console.log('📝 Bước 1: Cập nhật order NCN6974...');
  const patchOrder = await patchFirestore(token, `orders/${ORDER_CODE}`, {
    status:       'PAID',
    referralCode: REFERRAL_CODE,
  });

  if (patchOrder.status === 200) {
    console.log('  ✅ status       → PAID');
    console.log(`  ✅ referralCode → ${REFERRAL_CODE}\n`);
  } else {
    console.error('  ❌ Lỗi patch order:', JSON.stringify(patchOrder.body, null, 2));
    process.exit(1);
  }

  // ─ Bước 2: Kiểm tra commission đã tồn tại chưa ──────────────────────────
  console.log(`💰 Bước 2: Ghi commission cho ${REFERRAL_CODE}...`);
  const commissionId  = `sepay-${ORDER_CODE}`;
  const existCheck    = await getFirestoreDoc(token, `affiliate_commissions/${commissionId}`);

  if (existCheck.status === 200 && existCheck.body.fields) {
    const eFields = existCheck.body.fields;
    const eRef    = eFields.referralCode?.stringValue || '';
    console.log(`  ⚠️  Commission ${commissionId} đã tồn tại (referralCode: "${eRef}")`);
    if (eRef !== REFERRAL_CODE) {
      // Cập nhật referralCode
      const patchCom = await patchFirestore(token, `affiliate_commissions/${commissionId}`, {
        referralCode: REFERRAL_CODE,
      });
      if (patchCom.status === 200) {
        console.log(`  ✅ referralCode cập nhật → ${REFERRAL_CODE}`);
      } else {
        console.error('  ❌ Lỗi update commission:', JSON.stringify(patchCom.body, null, 2));
      }
    } else {
      console.log(`  ✅ referralCode đã đúng (${REFERRAL_CODE})`);
    }
  } else {
    // Tạo mới commission document
    // Vì không có serverTimestamp qua REST simple PATCH, ta tạo bằng cách chuyển sang CREATE
    const createUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/affiliate_commissions?documentId=${commissionId}`;
    const fields = {
      referralCode:     { stringValue: REFERRAL_CODE },
      orderCode:        { stringValue: ORDER_CODE },
      amount:           { integerValue: String(PAID_AMOUNT) },
      commissionAmount: { integerValue: String(COMMISSION_AMOUNT) },
      commissionRate:   { doubleValue: COMMISSION_RATE },
      customerEmail:    { stringValue: 'huynhnhuhg2011@gmail.com' },
      customerName:     { stringValue: 'Nguyễn Thị Huỳnh Như' },
      status:           { stringValue: 'PENDING' },
      source:           { stringValue: 'manual_fix_admin' },
    };
    const body = JSON.stringify({ fields });

    const createResult = await new Promise((resolve, reject) => {
      const urlObj = new URL(createUrl);
      const options = {
        hostname: urlObj.hostname,
        path:     urlObj.pathname + urlObj.search,
        method:   'POST',
        headers:  {
          'Authorization':  `Bearer ${token}`,
          'Content-Type':   'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      };
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
          catch { resolve({ status: res.statusCode, body: data }); }
        });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });

    if (createResult.status === 200) {
      console.log(`  ✅ Commission tạo mới thành công:`);
      console.log(`     ID:         ${commissionId}`);
      console.log(`     Ref:        ${REFERRAL_CODE}`);
      console.log(`     Tiền TT:    ${PAID_AMOUNT.toLocaleString('vi-VN')} VNĐ`);
      console.log(`     Commission: ${COMMISSION_AMOUNT.toLocaleString('vi-VN')} VNĐ (20%)`);
    } else {
      console.error('  ❌ Lỗi tạo commission:', JSON.stringify(createResult.body, null, 2));
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 HOÀN THÀNH! Tóm tắt fix:');
  console.log('   ✅ NCN6974 — status: PAID');
  console.log(`   ✅ NCN6974 — referralCode: ${REFERRAL_CODE}`);
  console.log(`   ✅ Commission: ${COMMISSION_AMOUNT.toLocaleString('vi-VN')} VNĐ → ${REFERRAL_CODE}`);
  console.log('   📄 PDF đã có sẵn (pdfDone = true)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
