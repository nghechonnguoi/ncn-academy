const fetch = require('node-fetch');

const data = {
  gateway: "OCB",
  transactionDate: new Date().toISOString(),
  accountNumber: "SEPNGHECHONNGUOI",
  content: "NCN 516",
  transferType: "in",
  transferAmount: 68000
};

fetch('https://ncn-academy-web.vercel.app/api/sepay/webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
})
.then(r => r.json())
.then(t => console.log("Webhook Response:", t))
.catch(e => console.error(e));
