const orders = ['6441', '5808', '8887', '7709'];

async function run() {
  for (const orderId of orders) {
    console.log(`\n--- Processing Order ${orderId} ---`);
    
    const res = await fetch(`https://firestore.googleapis.com/v1/projects/nghechonnguoi-f9eec/databases/(default)/documents/orders/${orderId}`);
    const doc = await res.json();
    
    if (!doc.fields || !doc.fields.payload) continue;
    
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
    if (!payload.HO_TEN && doc.fields.customerName) payload.HO_TEN = parseFirestoreValue(doc.fields.customerName);
    if (!payload.EMAIL && doc.fields.customerEmail) payload.EMAIL = parseFirestoreValue(doc.fields.customerEmail);
    payload.orderCode = orderId;
    
    console.log(`Triggering generate-pdf for ${payload.HO_TEN}...`);
    const pdfRes = await fetch('https://ncn-academy-web.vercel.app/api/generate-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    // Wait a bit for Firestore to update
    await new Promise(r => setTimeout(r, 2000));
    
    // Fetch updated document to get pdfUrl
    const updatedRes = await fetch(`https://firestore.googleapis.com/v1/projects/nghechonnguoi-f9eec/databases/(default)/documents/orders/${orderId}`);
    const updatedDoc = await updatedRes.json();
    
    const pdfUrl = updatedDoc.fields.pdfUrl ? updatedDoc.fields.pdfUrl.stringValue : "NO URL FOUND";
    
    console.log(`✅ LINK TẢI PDF CHO ${payload.HO_TEN}:`);
    console.log(pdfUrl);
    
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
  }
}

run().catch(console.error);
