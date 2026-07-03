const orders = ['7709', '6441', '5808', '8887'];

async function run() {
  for (const orderId of orders) {
    console.log(`\n--- Processing Order ${orderId} ---`);
    
    // 1. Fetch Order Payload
    const res = await fetch(`https://firestore.googleapis.com/v1/projects/nghechonnguoi-f9eec/databases/(default)/documents/orders/${orderId}`);
    const doc = await res.json();
    
    if (!doc.fields || !doc.fields.payload) {
      console.error(`Order ${orderId} or payload not found! Skipping.`);
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
    
    // Fallback if missing
    if (!payload.HO_TEN && doc.fields.customerName) {
       payload.HO_TEN = parseFirestoreValue(doc.fields.customerName);
    }
    if (!payload.EMAIL && doc.fields.customerEmail) {
       payload.EMAIL = parseFirestoreValue(doc.fields.customerEmail);
    }
    
    payload.orderCode = orderId;
    
    console.log(`Extracted payload for: ${payload.HO_TEN} | Email: ${payload.EMAIL} | R_PCT: ${payload.R_PCT}`);
    
    // 2. Trigger generate-pdf
    console.log(`Triggering generate-pdf for ${orderId}...`);
    const pdfRes = await fetch('https://ncn-academy-web.vercel.app/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    console.log(`Generate PDF Status for ${orderId}: ${pdfRes.status}`);
    
    if (pdfRes.ok) {
      // 3. Mark as PAID
      await fetch(`https://firestore.googleapis.com/v1/projects/nghechonnguoi-f9eec/databases/(default)/documents/orders/${orderId}?updateMask.fieldPaths=status&updateMask.fieldPaths=pdfGenerating&updateMask.fieldPaths=pdfDone`, {
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
      console.log(`Successfully generated PDF and marked ${orderId} as PAID! Email sent to ${payload.EMAIL}`);
    } else {
      console.log(`Failed to generate PDF for ${orderId}`);
    }
  }
}

run().catch(console.error);
