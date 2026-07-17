const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Load .env
const envPath = 'D:\\NCN-Academy\\.env';
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) {
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[m[1]] = val;
  }
});

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function main() {
  console.log('Đang tìm hồ sơ Phạm Thị Ngàn...\n');
  const snap = await db.collection('orders').get();
  let found = [];
  
  snap.forEach(doc => {
    const d = doc.data();
    const payload = d.payload || {};
    const name = (payload.HOTEN || d.HOTEN || d.fullName || d.name || '').toLowerCase();
    if (name.includes('ngàn') || name.includes('ngan') || name.includes('ngân')) {
      found.push({ id: doc.id, ...d });
    }
  });

  if (found.length === 0) {
    console.log('Không tìm thấy. Liệt kê tất cả orders gần đây:\n');
    const all = [];
    snap.forEach(doc => {
      const d = doc.data();
      const payload = d.payload || {};
      all.push({ 
        id: doc.id, 
        name: payload.HOTEN || d.HOTEN || d.fullName || '?',
        status: d.status,
        createdAt: d.createdAt
      });
    });
    all.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    all.slice(0, 20).forEach(o => console.log(`[${o.id}] ${o.name} — ${o.status}`));
  } else {
    found.forEach(order => {
      console.log('=== TÌM THẤY ===');
      console.log('Order ID:', order.id);
      const payload = order.payload || {};
      console.log('Payload:', JSON.stringify(payload, null, 2));
      console.log('Status:', order.status);
    });
  }
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
