/**
 * Ghi nhận hoa hồng: Cập nhật referralCode cho order NCN-9546 → TRANG14
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
const ORDER_ID   = '9546';
const AFF_CODE   = 'TRANG14';

// Firebase CLI client credentials (public, used by all firebase-tools installations)
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
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.access_token) resolve(parsed.access_token);
          else reject(new Error(`Token refresh failed: ${data}`));
        } catch(e) { reject(new Error(`Parse error: ${data}`)); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function firestoreGet(accessToken, docPath) {
  return new Promise((resolve, reject) => {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${docPath}`;
    https.get(url, { headers: { 'Authorization': `Bearer ${accessToken}` } }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch(e) { resolve({ status: res.statusCode, body: d }); }
      });
    }).on('error', reject);
  });
}

function patchFirestore(accessToken, docPath, fields) {
  return new Promise((resolve, reject) => {
    const fieldMask = Object.keys(fields).map(k => `updateMask.fieldPaths=${k}`).join('&');
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${docPath}?${fieldMask}`;

    function toFirestoreValue(v) {
      if (typeof v === 'string')  return { stringValue: v };
      if (typeof v === 'number')  return { integerValue: String(v) };
      if (typeof v === 'boolean') return { booleanValue: v };
      return { stringValue: String(v) };
    }

    const firestoreFields = {};
    for (const [k, v] of Object.entries(fields)) {
      firestoreFields[k] = toFirestoreValue(v);
    }

    const body = JSON.stringify({ fields: firestoreFields });
    const urlObj = new URL(url);

    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      }
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

async function main() {
  console.log(`\n📝 Ghi nhận hoa hồng: order NCN-${ORDER_ID} → affiliate "${AFF_CODE}"\n`);

  // Bước 0: Refresh access token
  console.log('🔑 Lấy access token mới...');
  const accessToken = await refreshAccessToken();
  console.log('✅ Đã lấy access token.\n');

  // Bước 1: Kiểm tra order có tồn tại
  console.log('🔍 Kiểm tra order...');
  const checkResult = await firestoreGet(accessToken, `orders/${ORDER_ID}`);

  if (checkResult.status !== 200) {
    console.error(`❌ Order ${ORDER_ID} không tìm thấy trên Firestore (HTTP ${checkResult.status})`);
    console.error(JSON.stringify(checkResult.body, null, 2));
    process.exit(1);
  }

  const fields = checkResult.body.fields || {};
  console.log('  Order ID     :', ORDER_ID);
  console.log('  Status       :', fields.status?.stringValue || '?');
  console.log('  Amount       :', fields.amount?.integerValue || fields.amount?.doubleValue || '?');
  console.log('  Customer     :', fields.customerName?.stringValue || fields.payload?.mapValue?.fields?.HOTEN?.stringValue || '?');
  console.log('  Current Ref  :', fields.referralCode?.stringValue || '(trống)');
  console.log('');

  // Bước 2: Cập nhật referralCode
  console.log(`📝 Cập nhật referralCode = "${AFF_CODE}"...`);
  const result = await patchFirestore(accessToken, `orders/${ORDER_ID}`, {
    referralCode: AFF_CODE,
  });

  if (result.status === 200) {
    console.log(`\n✅ Thành công! Order NCN-${ORDER_ID} đã ghi nhận affiliate: ${AFF_CODE}`);
    
    // Verify
    console.log('\n🔍 Xác nhận lại...');
    const verifyResult = await firestoreGet(accessToken, `orders/${ORDER_ID}`);
    const verifiedFields = verifyResult.body?.fields || {};
    console.log('  referralCode :', verifiedFields.referralCode?.stringValue || '(trống)');
    console.log('  status       :', verifiedFields.status?.stringValue || '?');
    console.log('\n✅ Ghi nhận hoa hồng hoàn tất!');
  } else {
    console.error(`❌ Lỗi HTTP ${result.status}:`);
    console.error(JSON.stringify(result.body, null, 2));
    process.exit(1);
  }
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
