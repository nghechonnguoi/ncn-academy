/**
 * list-van-codes.js — chạy từ thư mục apps/web
 * Dùng require() tương đối để load firebase-admin từ node_modules của project
 */
const path = require('path');

// Resolve firebase-admin từ project
const adminPath = path.resolve(__dirname, '../../node_modules/firebase-admin');
const { initializeApp } = require(path.join(adminPath, 'lib/app/index.js'));
const { getFirestore } = require(path.join(adminPath, 'lib/firestore/index.js'));

async function main() {
  initializeApp({ projectId: 'nghechonnguoi-f9eec' });
  const db = getFirestore();
  
  console.log('Querying coupons...\n');
  const snapshot = await db.collection('coupons')
    .orderBy('createdAt', 'asc')
    .get();
  
  const vanCodes = [];
  snapshot.forEach(doc => {
    if (doc.id.startsWith('VAN')) vanCodes.push(doc.id);
  });
  
  console.log(`Tổng số mã VAN: ${vanCodes.length}\n`);
  vanCodes.forEach((code, i) => {
    console.log(`${String(i+1).padStart(2, ' ')}. ${code}`);
  });
}

main().catch(console.error);
