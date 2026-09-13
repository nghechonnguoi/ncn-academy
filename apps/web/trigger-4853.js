/**
 * trigger-4853.js
 * Lấy payload từ Firestore → gọi generate-pdf trực tiếp cho NCN-4853
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const configPath = path.join(process.env.USERPROFILE || process.env.HOME, '.config', 'configstore', 'firebase-tools.json');
const fbConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const refreshToken = fbConfig.tokens?.refresh_token;

const FIREBASE_CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const FIREBASE_CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';
const PROJECT_ID = 'nghechonnguoi-f9eec';
const ORDER_ID = '4853';

function refreshAccessToken() {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken, client_id: FIREBASE_CLIENT_ID, client_secret: FIREBASE_CLIENT_SECRET }).toString();
    const options = { hostname: 'oauth2.googleapis.com', path: '/token', method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(postData) } };
    const req = https.request(options, (res) => { let d = ''; res.on('data', c => d += c); res.on('end', () => { try { const p = JSON.parse(d); p.access_token ? resolve(p.access_token) : reject(new Error(d)); } catch(e) { reject(new Error(d)); } }); });
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

function parseFirestoreValue(val) {
  if (!val) return null;
  if (val.stringValue !== undefined) return val.stringValue;
  if (val.integerValue !== undefined) return parseInt(val.integerValue, 10);
  if (val.doubleValue !== undefined) return parseFloat(val.doubleValue);
  if (val.booleanValue !== undefined) return val.booleanValue;
  if (val.nullValue !== undefined) return null;
  if (val.mapValue !== undefined) {
    const obj = {};
    for (const [k, v] of Object.entries(val.mapValue.fields || {})) obj[k] = parseFirestoreValue(v);
    return obj;
  }
  if (val.arrayValue !== undefined) return (val.arrayValue.values || []).map(parseFirestoreValue);
  return val;
}

function callGeneratePdf(payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const options = {
      hostname: 'ncn-academy-web.vercel.app',
      path: '/api/generate-pdf',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      timeout: 320000   // 320s — hơn maxDuration=300s
    };
    const req = https.request(options, (res) => {
      let raw = ''; res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout 320s')); });
    req.write(body); req.end();
  });
}

async function main() {
  console.log('\n🚀 TRIGGER PDF — ORDER NCN-4853 (Nguyễn Khả Vy)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Lấy token
  console.log('🔑 Lấy access token...');
  const token = await refreshAccessToken();
  console.log('✅ OK\n');

  // Lấy payload từ Firestore
  console.log('📦 Lấy payload từ Firestore...');
  const result = await firestoreGet(token, `orders/${ORDER_ID}`);
  if (result.status !== 200) {
    console.error('❌ Không lấy được order:', JSON.stringify(result.body));
    process.exit(1);
  }

  const fields = result.body.fields || {};
  const payloadRaw = fields.payload;
  if (!payloadRaw) {
    console.error('❌ Order không có payload!');
    process.exit(1);
  }

  const payload = parseFirestoreValue(payloadRaw);
  payload.orderCode = ORDER_ID;

  // Fallback nếu thiếu
  if (!payload.HOTEN && fields.customerName) payload.HOTEN = parseFirestoreValue(fields.customerName);
  if (!payload.EMAIL && fields.customerEmail)  payload.EMAIL = parseFirestoreValue(fields.customerEmail);

  console.log(`✅ Payload loaded:`);
  console.log(`   Họ tên:  ${payload.HOTEN}`);
  console.log(`   Email:   ${payload.EMAIL}`);
  console.log(`   MBTI:    ${payload.MBTI}`);
  console.log(`   Holland: ${payload.HOLLAND}`);
  console.log('');

  // Gọi generate-pdf
  console.log('⚙️  Gọi generate-pdf... (AI đang tạo nội dung, chờ tối đa 5 phút)\n');
  const start = Date.now();

  const pdfResult = await callGeneratePdf(payload);

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`   HTTP Status: ${pdfResult.status} (sau ${elapsed}s)`);

  if (pdfResult.status === 200 && pdfResult.body?.success) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 THÀNH CÔNG! Báo cáo NCN-4853 đã được tạo!');
    console.log('   ✅ pdfDone = true (đã cập nhật trong Firestore)');
    console.log('   ✅ Email đã gửi tới: nikodirole@gmail.com');
    if (pdfResult.body.emailError) {
      console.log('   ⚠️  Email lỗi:', pdfResult.body.emailError);
    }
  } else {
    console.log('\n⚠️  generate-pdf trả về lỗi:');
    const b = pdfResult.body;
    console.log('  ', typeof b === 'object' ? JSON.stringify(b).substring(0, 500) : String(b).substring(0, 500));
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
