/**
 * get-order-4853.js
 * Lấy thông tin order NCN4853 từ Firestore qua REST API
 * Dùng Firebase CLI refresh token
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const configPath = path.join(process.env.USERPROFILE || process.env.HOME, '.config', 'configstore', 'firebase-tools.json');
const fbConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const refreshToken = fbConfig.tokens?.refresh_token;

if (!refreshToken) {
  console.error('❌ Không tìm thấy refresh_token. Hãy chạy: firebase login');
  process.exit(1);
}

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

const PROJECT_ID = 'nghechonnguoi-f9eec';
const ORDER_ID = process.argv[2] || '4853';

function firestoreGet(token, docPath) {
  return new Promise((resolve, reject) => {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${docPath}`;
    https.get(url, { headers: { 'Authorization': `Bearer ${token}` } }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(d) }); } catch(e) { resolve({ status: res.statusCode, body: d }); } });
    }).on('error', reject);
  });
}

function getVal(field) {
  if (!field) return '(trống)';
  return field.stringValue ?? field.integerValue ?? field.booleanValue ?? field.doubleValue ?? JSON.stringify(field);
}

async function main() {
  console.log(`\n🔍 Đang lấy thông tin order: NCN${ORDER_ID}`);
  console.log('🔑 Lấy access token...');
  const token = await refreshAccessToken();
  console.log('✅ Đã lấy access token.\n');

  const result = await firestoreGet(token, `orders/${ORDER_ID}`);

  if (result.status === 200) {
    const fields = result.body.fields || {};
    console.log('✅ Tìm thấy order:');
    console.log(`   Order ID:        NCN${ORDER_ID}`);
    console.log(`   referralCode:    ${getVal(fields.referralCode)}`);
    console.log(`   status:          ${getVal(fields.status)}`);
    console.log(`   amount:          ${getVal(fields.amount)}`);
    console.log(`   paidAmount:      ${getVal(fields.paidAmount)}`);
    console.log(`   customerName:    ${getVal(fields.customerName) || fields.payload?.mapValue?.fields?.HOTEN?.stringValue || '?'}`);
    console.log(`   customerEmail:   ${getVal(fields.customerEmail) || fields.payload?.mapValue?.fields?.EMAIL?.stringValue || '?'}`);
    const createdAt = result.body.createTime || getVal(fields.createdAt);
    console.log(`   createdAt:       ${createdAt}`);
    console.log('');
    if (!fields.referralCode || getVal(fields.referralCode) === '(trống)') {
      console.log('⚠️  Order này KHÔNG có mã giới thiệu (referralCode rỗng)');
    } else {
      console.log(`🎯 Order NCN${ORDER_ID} thuộc mã giới thiệu: ${getVal(fields.referralCode)}`);
    }
  } else if (result.status === 404) {
    console.log(`❌ Không tìm thấy order NCN${ORDER_ID} trong Firestore`);
    console.log('   (document ID không tồn tại)');
  } else {
    console.error(`❌ Lỗi HTTP ${result.status}:`);
    console.error(JSON.stringify(result.body, null, 2));
  }
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });

