const fetch = require('node-fetch');

async function test() {
  const url = 'https://ncn-academy-web.vercel.app/api/sepay/webhook';
  const data = {
    gateway: "TEST",
    transactionDate: new Date().toISOString(),
    accountNumber: "TEST",
    content: "NCN 516",
    transferType: "in",
    transferAmount: 68000
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  console.log(await res.text());
}
test();
