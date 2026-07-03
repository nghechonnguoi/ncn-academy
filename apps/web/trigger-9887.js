const orderId = 'NCN-9887';

async function run() {
  console.log(`\n--- Processing Order ${orderId} ---`);
  
  const res = await fetch(`https://firestore.googleapis.com/v1/projects/nghechonnguoi-f9eec/databases/(default)/documents/orders/${orderId}`);
  const doc = await res.json();
  
  if (doc.error) {
    console.log("Not found as NCN-9887, trying 9887...");
    const res2 = await fetch(`https://firestore.googleapis.com/v1/projects/nghechonnguoi-f9eec/databases/(default)/documents/orders/9887`);
    const doc2 = await res2.json();
    if (doc2.error) {
        console.error("Order not found!");
        return;
    }
    processDoc(doc2, '9887');
  } else {
    processDoc(doc, orderId);
  }
}

async function processDoc(doc, id) {
  function parseFirestoreValue(val) {
    if (!val) return null;
    if (val.stringValue !== undefined) return val.stringValue;
    if (val.integerValue !== undefined) return parseInt(val.integerValue, 10);
    if (val.doubleValue !== undefined) return parseFloat(val.doubleValue);
    if (val.booleanValue !== undefined) return val.booleanValue;
    if (val.mapValue !== undefined) {
      const obj = {};
      for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
        obj[k] = parseFirestoreValue(v);
      }
      return obj;
    }
    if (val.arrayValue !== undefined) {
      return (val.arrayValue.values || []).map(parseFirestoreValue);
    }
    if (val.nullValue !== undefined) return null;
    return val;
  }
  
  let payload = {};
  if (doc.fields && doc.fields.HO_TEN) {
     payload = parseFirestoreValue({ mapValue: { fields: doc.fields } });
  } else if (doc.fields && doc.fields.payload) {
     payload = parseFirestoreValue(doc.fields.payload);
  }
  
  console.log(`Extracted payload for: ${payload.HO_TEN} | Email: ${payload.EMAIL}`);
  payload.orderCode = id;
  
  console.log(`Triggering generate-pdf for ${id}...`);
  const pdfRes = await fetch('https://ncn-academy-web.vercel.app/api/generate-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  const resultText = await pdfRes.text();
  console.log(`Generate PDF Status: ${pdfRes.status}`);
  console.log(`Result length:`, resultText.length);
  
  if (pdfRes.status === 200) {
      // Mark as PAID so it doesn't stay PENDING
      await fetch(`https://firestore.googleapis.com/v1/projects/nghechonnguoi-f9eec/databases/(default)/documents/orders/${id}?updateMask.fieldPaths=status&updateMask.fieldPaths=pdfGenerating&updateMask.fieldPaths=pdfDone`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            status: { stringValue: 'PAID' },
            pdfGenerating: { booleanValue: false },
            pdfDone: { booleanValue: true }
          }
        })
      });
      console.log('Marked as PAID in Firestore');
  }
}

run().catch(console.error);
