// Reset assessment for specific email
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

let serviceAccount;
try {
  const envContent = fs.readFileSync('apps/web/.env.local', 'utf8');
  const match = envContent.match(/FIREBASE_SERVICE_ACCOUNT=(.+)/);
  if (match) serviceAccount = JSON.parse(match[1]);
} catch(e) {}

if (!serviceAccount) { console.error('Cannot load Firebase SA'); process.exit(1); }

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function resetEmail(email) {
  const snap = await db.collection('orders').where('email', '==', email).get();
  if (snap.empty) { console.log('No orders found for', email); return; }
  const batch = db.batch();
  snap.forEach(doc => {
    console.log('Resetting:', doc.id, doc.data().email);
    batch.update(doc.ref, {
      pdfDone: false, pdfGenerating: false,
      aiTextsCache: null, aiGenerationFailed: false, aiErrorDetail: null,
      assessmentDone: false, assessmentData: null,
    });
  });
  await batch.commit();
  console.log('Reset', snap.size, 'order(s) for', email);
}

resetEmail('ngangpt76868@gmail.com').catch(console.error);
