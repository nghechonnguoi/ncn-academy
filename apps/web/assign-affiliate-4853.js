/**
 * assign-affiliate-4853.js
 * Ghi nhận hoa hồng: Cập nhật referralCode cho order NCN-4853 → TRAN686
 * Dùng Firestore REST API + refresh token từ Firebase CLI
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const configPath = path.join(process.env.USERPROFILE || process.env.HOME, '.config', 'configstore', 'firebase-tools.json');
const fbConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const refreshToken = fbConfig.tokens?.refresh_token;

if (!refreshToken) {
  console.error('❌ Không tìm thấy refresh_token. Hãy chạy "firebase login" trước.');
  process.exit(1);
}

const PROJECT_ID = 'nghechonnguoi-f9eec';
const ORDER_ID   = '4853';
const AFF_CODE   = 'TRAN686';

const FIREBASE_CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const FIREBASE_CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';

function refreshAccessToken() {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: FIREBASE_CLIENT_ID,
      client_secret: FIREBASE_CLIENT_SECRET,
    }).toString();
    const options = {
      hostname: 'oauth2.googleapis.com', path: '/token', method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(postData) }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { const p = JSON.parse(data); p.access_token ? resolve(p.access_token) : reject(new Error(data)); }
        catch(e) { reject(new Error(data)); }
      });
    });
    req.on('error', reject); req.write(postData); req.end();
  });
}

function firestoreGet(token, docPath) {
  return new Promise((resolve, reject) => {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${docPath}`;
    https.get(url, { headers: { 'Authorization': `Bearer ${token}` } }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(d) }); } catch(e) { resolve({ status: res.statusCode, body: d }); } });
    }).on('error', reject);
  });
}

function patchFirestore(token, docPath, fields) {
  return new Promise((resolve, reject) => {
    const fieldMask = Object.keys(fields).map(k => `updateMask.fieldPaths=${k}`).join('&');
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${docPath}?${fieldMask}`;
    const toVal = (v) => typeof v === 'string' ? { stringValue: v } : typeof v === 'number' ? { integerValue: String(v) } : { stringValue: String(v) };
    const ff = {}; for (const [k, v] of Object.entries(fields)) ff[k] = toVal(v);
    const body = JSON.stringify({ fields: ff }); const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname, path: urlObj.pathname + urlObj.search, method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    };
    const req = https.request(options, (res) => {
      let data = ''; res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(data) }); } catch(e) { resolve({ status: res.statusCode, body: data }); } });
    });
    req.on('error', reject); req.write(body); req.end();
  });
}

async function main() {
  console.log(`\n📝 Ghi nhận hoa hồng: order NCN-${ORDER_ID} → affiliate "${AFF_CODE}"\n`);
  console.log('🔑 Lấy access token mới...');
  const token = await refreshAccessToken();
  console.log('✅ Đã lấy access token.\n');

  // Kiểm tra order hiện tại
  console.log('🔍 Kiểm tra order...');
  const check = await firestoreGet(token, `orders/${ORDER_ID}`);
  if (check.status !== 200) {
    console.error(`❌ Order ${ORDER_ID} không tìm thấy (HTTP ${check.status})`);
    console.error(JSON.stringify(check.body, null, 2));
    process.exit(1);
  }
  const f = check.body.fields || {};
  console.log('  Order ID     :', ORDER_ID);
  console.log('  Status       :', f.status?.stringValue || '?');
  console.log('  Amount       :', f.amount?.integerValue || f.amount?.doubleValue || '?');
  console.log('  paidAmount   :', f.paidAmount?.integerValue || f.paidAmount?.doubleValue || '?');
  console.log('  Customer     :', f.customerName?.stringValue || f.payload?.mapValue?.fields?.HOTEN?.stringValue || '?');
  console.log('  Current Ref  :', f.referralCode?.stringValue || '(trống)');
  console.log('');

  // Patch referralCode
  console.log(`📝 Cập nhật referralCode = "${AFF_CODE}"...`);
  const result = await patchFirestore(token, `orders/${ORDER_ID}`, { referralCode: AFF_CODE });
  if (result.status !== 200) {
    console.error(`❌ Lỗi HTTP ${result.status}:`);
    console.error(JSON.stringify(result.body, null, 2));
    process.exit(1);
  }
  console.log(`✅ Đã cập nhật referralCode = "${AFF_CODE}" thành công!\n`);

  // Xác nhận lại
  console.log('🔍 Xác nhận lại...');
  const v = await firestoreGet(token, `orders/${ORDER_ID}`);
  const vf = v.body?.fields || {};
  console.log('  referralCode :', vf.referralCode?.stringValue || '(trống)');
  console.log('  status       :', vf.status?.stringValue || '?');
  console.log('  paidAmount   :', vf.paidAmount?.integerValue || '?');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🎉 Hoàn tất! Order NCN-${ORDER_ID} (Nguyễn Khả Vy) đã được tính doanh số cho: ${AFF_CODE}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
