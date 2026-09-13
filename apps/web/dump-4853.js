// Quick dump toàn bộ fields của order 4853
const https = require('https');
const fs = require('fs');
const path = require('path');

const configPath = path.join(process.env.USERPROFILE || process.env.HOME, '.config', 'configstore', 'firebase-tools.json');
const fbConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const refreshToken = fbConfig.tokens?.refresh_token;

const FIREBASE_CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const FIREBASE_CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';

function refreshAccessToken() {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken, client_id: FIREBASE_CLIENT_ID, client_secret: FIREBASE_CLIENT_SECRET }).toString();
    const options = { hostname: 'oauth2.googleapis.com', path: '/token', method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(postData) } };
    const req = https.request(options, (res) => { let d = ''; res.on('data', c => d += c); res.on('end', () => { try { const p = JSON.parse(d); p.access_token ? resolve(p.access_token) : reject(new Error(d)); } catch(e) { reject(new Error(d)); } }); });
    req.on('error', reject); req.write(postData); req.end();
  });
}

const PROJECT_ID = 'nghechonnguoi-f9eec';

async function main() {
  const token = await refreshAccessToken();
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/orders/4853`;
  await new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Authorization': `Bearer ${token}` } }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        const doc = JSON.parse(d);
        console.log(JSON.stringify(doc, null, 2));
        resolve();
      });
    }).on('error', reject);
  });
}

main().catch(console.error);
