const fetch = require('node-fetch');
fetch('https://ncn-academy-web.vercel.app/api/debug-order')
  .then(r => r.text())
  .then(t => console.log(t))
  .catch(console.error);
