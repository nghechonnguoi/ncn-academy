const fs = require('fs');

const orderId = 'NCN-9787';

async function run() {
  console.log(`\n--- Processing Order ${orderId} ---`);
  
  const res = await fetch(`https://firestore.googleapis.com/v1/projects/nghechonnguoi-f9eec/databases/(default)/documents/orders/${orderId}`);
  const doc = await res.json();
  
  if (doc.error) {
    console.log("Not found as NCN-9787, trying 9787...");
    const res2 = await fetch(`https://firestore.googleapis.com/v1/projects/nghechonnguoi-f9eec/databases/(default)/documents/orders/9787`);
    const doc2 = await res2.json();
    if (doc2.error) {
        console.error("Order not found!");
        return;
    }
    processDoc(doc2, '9787');
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
  
  console.log(`Generate PDF Status: ${pdfRes.status}`);
  if (pdfRes.status === 200) {
      const jsonRes = await pdfRes.json();
      if (jsonRes.pdfBase64) {
          const buffer = Buffer.from(jsonRes.pdfBase64, 'base64');
          fs.writeFileSync(`d:/Nhà của Ngàn/NCN-${id}.pdf`, buffer);
          console.log(`Saved NCN-${id}.pdf successfully to d:/Nhà của Ngàn/!`);
      } else {
          console.log("No pdfBase64 in response, saving as raw text just in case.");
          const text = JSON.stringify(jsonRes);
          fs.writeFileSync(`d:/Nhà của Ngàn/NCN-${id}-error.txt`, text);
      }
  } else {
      console.log('Failed to generate PDF');
      const text = await pdfRes.text();
      console.log(text);
  }
}

run().catch(console.error);
