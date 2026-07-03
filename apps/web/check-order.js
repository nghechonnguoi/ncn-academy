const admin = require('firebase-admin');

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkOrder(id) {
  const doc = await db.collection('orders').doc(id.toString()).get();
  console.log(`Order ${id} exists:`, doc.exists);
  if (doc.exists) {
    console.log("Data:", doc.data());
  }
}

checkOrder("6855").catch(console.error);
