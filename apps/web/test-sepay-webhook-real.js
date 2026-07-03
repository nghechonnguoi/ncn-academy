const fetch = require('node-fetch');

async function testWebhook() {
  const url = 'https://ncn-academy-web.vercel.app/api/sepay/webhook';
  const payload = {
    gateway: "TEST",
    transactionDate: new Date().toISOString(),
    accountNumber: "TEST",
    content: "NCN 9999",
    transferType: "in",
    transferAmount: 68000
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    console.log("Status:", res.status);
    console.log("Headers:", res.headers.raw());
    console.log("Response:", await res.text());
  } catch (err) {
    console.error("Error:", err);
  }
}

testWebhook();
