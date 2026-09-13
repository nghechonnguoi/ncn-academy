/**
 * Cập nhật referralCode thủ công cho order NCN-7879 → VAN418
 * Dùng Firestore REST API với Firebase CLI access token
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const configPath = path.join(process.env.USERPROFILE || process.env.HOME, '.config', 'configstore', 'firebase-tools.json');
const fbConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const accessToken = fbConfig.tokens?.access_token;

const PROJECT_ID = 'nghechonnguoi-f9eec';
const ORDER_ID   = '7879';
const AFF_CODE   = 'VAN418';

function patchFirestore(docPath, fields) {
  return new Promise((resolve, reject) => {
    // Build field mask for PATCH
    const fieldMask = Object.keys(fields).map(k => `updateMask.fieldPaths=${k}`).join('&');
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${docPath}?${fieldMask}`;

    // Convert plain object to Firestore field format
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
  console.log(`\n📝 Cập nhật order ${ORDER_ID} → referralCode = "${AFF_CODE}"...\n`);

  const result = await patchFirestore(`orders/${ORDER_ID}`, {
    referralCode: AFF_CODE,
  });

  if (result.status === 200) {
    console.log(`✅ Thành công! Order NCN-${ORDER_ID} đã ghi nhận affiliate: ${AFF_CODE}`);
    // Verify lại
    console.log('\n🔍 Kiểm tra lại...');
    const https2 = require('https');
    const verifyUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/orders/${ORDER_ID}`;
    const verifyReq = https2.get(verifyUrl, { headers: { 'Authorization': `Bearer ${accessToken}` } }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        const doc = JSON.parse(d);
        const fields = doc.fields || {};
        console.log('  referralCode :', fields.referralCode?.stringValue || '(trống)');
        console.log('  status       :', fields.status?.stringValue || '?');
        console.log('  customerName :', fields.customerName?.stringValue || fields.payload?.mapValue?.fields?.HOTEN?.stringValue || '?');
        console.log('\n✅ Xác nhận hoàn tất!');
        process.exit(0);
      });
    });
    verifyReq.on('error', e => { console.error(e.message); process.exit(1); });
  } else {
    console.error(`❌ Lỗi HTTP ${result.status}:`);
    console.error(JSON.stringify(result.body, null, 2));
    process.exit(1);
  }
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
