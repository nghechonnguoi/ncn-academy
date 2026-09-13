/**
 * call-process-pending.js
 * Gọi /api/admin/process-pending-pdfs để xử lý NCN-4853
 * Endpoint này chạy bên trong Vercel → không bị ECONNRESET
 */
const https = require('https');

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 60000 }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(d) }); } catch { resolve({ status: res.statusCode, body: d }); } });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function main() {
  console.log('\n🔄 Gọi process-pending-pdfs...');
  console.log('   (Vercel sẽ tự tìm NCN-4853 do status=PAID, pdfDone=false)\n');

  const result = await httpsGet('https://ncn-academy-web.vercel.app/api/admin/process-pending-pdfs');
  console.log('HTTP Status:', result.status);
  console.log('Response:', JSON.stringify(result.body, null, 2));
}

main().catch(console.error);
