const fs = require('fs');
const puppeteer = require('puppeteer-core');

const orders = ['6441', '5808', '8887', '7709'];

async function run() {
  const browser = await puppeteer.launch({ 
    headless: 'new',
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  });
  
  for (const orderId of orders) {
    console.log(`\n--- Fetching Order ${orderId} ---`);
    
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
    
    console.log(`Generating PDF locally for ${payload.HO_TEN}...`);
    
    // We can fetch the raw HTML from the production API?
    // Wait, generate-pdf is an API that doesn't return the PDF directly, it sends it via email or storage.
    // If I just want to generate it locally, I can read the bao-cao-pdf-template.html locally!
    let htmlContent = fs.readFileSync('d:/Nhà của Ngàn/bao-cao-pdf-template.html', 'utf8');
    
    for (const [key, value] of Object.entries(payload)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      htmlContent = htmlContent.replace(regex, value);
    }
    
    // Default values
    htmlContent = htmlContent.replace(/{{NGAY_THANG_NAM}}/g, new Date().toLocaleDateString('vi-VN'));
    
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const outputPath = `d:/Nhà của Ngàn/Bao-Cao-${orderId}.pdf`;
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '18mm', right: '18mm', bottom: '18mm', left: '20mm' }
    });
    
    console.log(`✅ Saved PDF to ${outputPath}`);
    await page.close();
  }
  
  await browser.close();
  console.log("All done!");
}

run().catch(console.error);
