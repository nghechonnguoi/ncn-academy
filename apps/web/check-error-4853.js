// check-error-4853.js — Lấy aiErrorDetail của order 4853
const https = require('https');
const fs = require('fs');
const path = require('path');

const configPath = path.join(process.env.USERPROFILE || process.env.HOME, '.config', 'configstore', 'firebase-tools.json');
const fbConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const refreshToken = fbConfig.tokens?.refresh_token;

const FIREBASE_CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const FIREBASE_CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';

function refreshAccessToken() {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken, client_id: FIREBASE_CLIENT_ID, client_secret: FIREBASE_CLIENT_SECRET }).toString();
    const options = { hostname: 'oauth2.googleapis.com', path: '/token', method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(postData) } };
    const req = https.request(options, (res) => { let d = ''; res.on('data', c => d += c); res.on('end', () => { try { const p = JSON.parse(d); p.access_token ? resolve(p.access_token) : reject(new Error(d)); } catch(e) { reject(new Error(d)); } }); });
    req.on('error', reject); req.write(postData); req.end();
  });
}

const PROJECT_ID = 'nghechonnguoi-f9eec';

async function main() {
  const token = await refreshAccessToken();
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/orders/4853`;

  await new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Authorization': `Bearer ${token}` } }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        const doc = JSON.parse(d);
        const f = doc.fields || {};

        console.log('\n📋 PHÂN TÍCH LỖI ORDER NCN-4853');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`  status:             ${f.status?.stringValue || '?'}`);
        console.log(`  pdfDone:            ${f.pdfDone?.booleanValue}`);
        console.log(`  pdfGenerating:      ${f.pdfGenerating?.booleanValue}`);
        console.log(`  aiGenerationFailed: ${f.aiGenerationFailed?.booleanValue}`);
        console.log(`  aiErrorDetail:      ${f.aiErrorDetail?.stringValue || f.aiErrorDetail?.nullValue !== undefined ? '(null - không có)' : '?'}`);
        console.log(`  aiTextsCache:       ${f.aiTextsCache ? '✅ có cache (' + (f.aiTextsCache.stringValue?.length || 0) + ' chars)' : '❌ không có cache'}`);
        console.log(`  createTime:         ${doc.createTime}`);
        console.log(`  updateTime:         ${doc.updateTime}`);

        // Check nếu status là PENDING thay vì PAID
        if (f.status?.stringValue === 'PENDING') {
          console.log('\n⚠️  PHÁT HIỆN VẤN ĐỀ:');
          console.log('   Status vẫn là PENDING thay vì PAID!');
          console.log('   → Order có paidAt nhưng status chưa được cập nhật lên PAID');
          console.log(`   paidAt:  ${f.paidAt?.timestampValue || '(không có)'}`);
          console.log(`   amount:  ${f.amount?.integerValue}`);
          console.log(`   paidAmount: ${f.paidAmount?.integerValue}`);
        }

        // Phân tích nguyên nhân aiGenerationFailed
        if (f.aiGenerationFailed?.booleanValue === true) {
          console.log('\n⚠️  AI GENERATION FAILED:');
          const errDetail = f.aiErrorDetail?.stringValue;
          if (errDetail && errDetail !== 'null') {
            console.log('   Chi tiết lỗi AI:', errDetail);
          } else {
            console.log('   Không có aiErrorDetail được lưu.');
            console.log('   Nguyên nhân khả năng: API key hết quota, timeout, hoặc model không khả dụng.');
          }
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        resolve();
      });
    }).on('error', reject);
  });
}

main().catch(console.error);
