const admin = require('firebase-admin');
const fs = require('fs');
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || fs.readFileSync('serviceAccount.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkOrder() {
  const doc = await db.collection('orders').doc('516').get();
  if (!doc.exists) {
    console.log('Order 516 DOES NOT EXIST!');
  } else {
    console.log('Order 516 DATA:', doc.data());
  }
  process.exit(0);
}

checkOrder();
