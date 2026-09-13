/**
 * fix-and-retry-4853.js
 * Bước 1: Fix status PENDING → PAID + reset aiGenerationFailed
 * Bước 2: Gọi retry-pdf để tạo lại báo cáo
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

function patchFirestore(token, docPath, fields) {
  return new Promise((resolve, reject) => {
    const fieldMask = Object.keys(fields).map(k => `updateMask.fieldPaths=${k}`).join('&');
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${docPath}?${fieldMask}`;
    const toVal = (v) => {
      if (v === null) return { nullValue: null };
      if (typeof v === 'string') return { stringValue: v };
      if (typeof v === 'boolean') return { booleanValue: v };
      if (typeof v === 'number') return { integerValue: String(v) };
      return { stringValue: String(v) };
    };
    const ff = {}; for (const [k, v] of Object.entries(fields)) ff[k] = toVal(v);
    const body = JSON.stringify({ fields: ff });
    const urlObj = new URL(url);
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

function postJson(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    };
    const lib = parsed.protocol === 'https:' ? https : require('http');
    const req = lib.request(options, (res) => {
      let raw = ''; res.on('data', chunk => raw += chunk);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); } catch { resolve({ status: res.statusCode, body: raw }); } });
    });
    req.on('error', reject); req.write(data); req.end();
  });
}

async function main() {
  console.log('\n🔧 FIX & RETRY ORDER NCN-4853 (Nguyễn Khả Vy)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('🔑 Lấy access token...');
  const token = await refreshAccessToken();
  console.log('✅ Đã lấy access token.\n');

  // ── BƯỚC 1: Fix status + reset AI flags ─────────────────────────
  console.log('📝 BƯỚC 1: Cập nhật Firestore...');
  const patch = await patchFirestore(token, `orders/${ORDER_ID}`, {
    status: 'PAID',
    aiGenerationFailed: false,
    aiErrorDetail: null,
    pdfDone: false,
    pdfGenerating: false,
  });

  if (patch.status === 200) {
    console.log('  ✅ status          → PAID');
    console.log('  ✅ aiGenerationFailed → false');
    console.log('  ✅ aiErrorDetail   → null (cleared)');
    console.log('  ✅ pdfDone         → false (ready to retry)');
  } else {
    console.error('  ❌ Lỗi patch Firestore:', JSON.stringify(patch.body, null, 2));
    process.exit(1);
  }

  // ── BƯỚC 2: Gọi retry-pdf API ───────────────────────────────────
  console.log('\n🚀 BƯỚC 2: Gọi retry-pdf để tạo lại báo cáo...');
  console.log('   (Quá trình này có thể mất 1-3 phút do AI generation)\n');

  const retryUrl = `https://ncn-academy-web.vercel.app/api/admin/retry-pdf?orderCode=${ORDER_ID}`;

  const retryResult = await new Promise((resolve, reject) => {
    const parsed = new URL(retryUrl);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      timeout: 180000  // 3 phút
    };
    const req = https.request(options, (res) => {
      let raw = ''; res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout sau 3 phút')); });
    req.end();
  });

  console.log(`   HTTP Status: ${retryResult.status}`);

  if (retryResult.status === 200 && retryResult.body?.success !== false) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 THÀNH CÔNG! Báo cáo NCN-4853 đã được tạo lại!');
    console.log('   Email sẽ được gửi tới: nikodirole@gmail.com');
    if (retryResult.body?.pdfResponse) {
      console.log('   PDF Response:', JSON.stringify(retryResult.body.pdfResponse).substring(0, 200));
    }
  } else {
    console.log('\n⚠️  Retry PDF trả về lỗi:');
    const body = retryResult.body;
    if (typeof body === 'object') {
      console.log('   error:', body.error || body.message || JSON.stringify(body).substring(0, 300));
    } else {
      console.log('  ', String(body).substring(0, 300));
    }
    console.log('\n💡 Gợi ý: Retry có thể timeout do Vercel giới hạn 30s.');
    console.log('   Bạn có thể vào Admin Dashboard → Retry PDF để thử lại thủ công.');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
