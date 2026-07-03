const fs = require('fs');
const path = require('path');

const orders = ['6441', '5808', '8887', '7709'];

async function run() {
  for (const orderId of orders) {
    console.log(`\n--- Processing Order ${orderId} ---`);
    
    // 1. Fetch the payload from Firestore
    const res = await fetch(`https://firestore.googleapis.com/v1/projects/nghechonnguoi-f9eec/databases/(default)/documents/orders/${orderId}`);
    const doc = await res.json();
    if (!doc.fields || !doc.fields.payload) {
      console.log(`No payload for ${orderId}`);
      continue;
    }
    
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
    
    const payload = parseFirestoreValue(doc.fields.payload);
    
    // Omit orderCode so Vercel returns the raw PDF buffer!
    delete payload.orderCode;
    
    console.log(`Triggering Vercel API for ${payload.HOTEN}... This takes ~20s due to AI generation.`);
    
    try {
      const pdfRes = await fetch('https://ncn-academy-web.vercel.app/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!pdfRes.ok) {
        console.error(`Vercel returned error status: ${pdfRes.status}`);
        const text = await pdfRes.text();
        console.error(text);
        continue;
      }
      
      const contentType = pdfRes.headers.get('content-type');
      if (contentType && contentType.includes('application/pdf')) {
        const buffer = await pdfRes.arrayBuffer();
        const outPath = `d:/Nhà của Ngàn/Bao-Cao-${orderId}.pdf`;
        fs.writeFileSync(outPath, Buffer.from(buffer));
        console.log(`✅ Saved FULL AI PDF to ${outPath}`);
      } else {
        console.log(`❌ Vercel did not return a PDF. Returned type: ${contentType}`);
        const text = await pdfRes.text();
        console.log(text);
      }
    } catch (e) {
      console.error(`Error processing ${orderId}:`, e.message);
    }
  }
}

run().catch(console.error);
