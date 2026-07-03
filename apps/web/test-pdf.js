const fetch = require('node-fetch');

async function run() {
  const payload = {
    "HO_TEN": "Test",
    "orderCode": "9999",
    "GIOI_TINH": "Nam",
    "NAM_SINH": "2000"
  };

  const res = await fetch('https://ncn-academy-web.vercel.app/api/generate-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  console.log("Status:", res.status);
  console.log("Response:", await res.text());
}

run();
