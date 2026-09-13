/**
 * trigger-9359.js — Reset pdfDone + trigger generate-pdf cho NCN-9359 (PHAM THI NGAN)
 */
const https = require("https");
const fs = require("fs");
const path = require("path");

const configPath = path.join(process.env.USERPROFILE || process.env.HOME, ".config", "configstore", "firebase-tools.json");
const fbConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
const refreshToken = fbConfig.tokens?.refresh_token;

const FIREBASE_CLIENT_ID = "563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com";
const FIREBASE_CLIENT_SECRET = "j9iVZfS8kkCEFUPaAeJV0sAi";
const PROJECT_ID = "nghechonnguoi-f9eec";
const ORDER_ID = "9359";
const API_HOST = "www.nghechonnguoi.com";

function refreshAccessToken() {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken, client_id: FIREBASE_CLIENT_ID, client_secret: FIREBASE_CLIENT_SECRET }).toString();
    const options = { hostname: "oauth2.googleapis.com", path: "/token", method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "Content-Length": Buffer.byteLength(postData) } };
    const req = https.request(options, (res) => { let d = ""; res.on("data", c => d += c); res.on("end", () => { try { const p = JSON.parse(d); p.access_token ? resolve(p.access_token) : reject(new Error(d)); } catch(e) { reject(new Error(d)); } }); });
    req.on("error", reject); req.write(postData); req.end();
  });
}

function firestoreGet(token, docPath) {
  return new Promise((resolve, reject) => {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${docPath}`;
    https.get(url, { headers: { "Authorization": `Bearer ${token}` } }, (res) => {
      let d = ""; res.on("data", c => d += c);
      res.on("end", () => { try { resolve(JSON.parse(d)); } catch(e) { reject(new Error(d)); } });
    }).on("error", reject);
  });
}

function firestorePatch(token, docPath, fields) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ fields });
    const updateMask = Object.keys(fields).map(k => `updateMask.fieldPaths=${k}`).join("&");
    const options = {
      hostname: "firestore.googleapis.com",
      path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents/${docPath}?${updateMask}`,
      method: "PATCH",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) }
    };
    const req = https.request(options, (res) => { let d = ""; res.on("data", c => d += c); res.on("end", () => { resolve(JSON.parse(d)); }); });
    req.on("error", reject); req.write(body); req.end();
  });
}

function parseDoc(doc) {
  if (!doc.fields) return null;
  const parse = (v) => {
    if (v.stringValue !== undefined) return v.stringValue;
    if (v.integerValue !== undefined) return parseInt(v.integerValue);
    if (v.doubleValue !== undefined) return v.doubleValue;
    if (v.booleanValue !== undefined) return v.booleanValue;
    if (v.nullValue !== undefined) return null;
    if (v.mapValue) { const r = {}; for (const [k, val] of Object.entries(v.mapValue.fields || {})) r[k] = parse(val); return r; }
    if (v.arrayValue) return (v.arrayValue.values || []).map(parse);
    return v;
  };
  const result = {};
  for (const [k, v] of Object.entries(doc.fields)) result[k] = parse(v);
  return result;
}

function callGeneratePdf(payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const options = { hostname: API_HOST, path: "/api/generate-pdf", method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) }, timeout: 280000 };
    const req = https.request(options, (res) => {
      let d = ""; res.on("data", c => d += c);
      res.on("end", () => { console.log(`HTTP ${res.statusCode}`); try { resolve({ status: res.statusCode, data: JSON.parse(d) }); } catch(e) { resolve({ status: res.statusCode, raw: d.substring(0, 300) }); } });
    });
    req.on("timeout", () => req.destroy(new Error("Timeout 280s")));
    req.on("error", reject);
    req.write(body); req.end();
  });
}

async function run() {
  console.log("Trigger generate-pdf NCN-9359 (PHAM THI NGAN)");
  const token = await refreshAccessToken();
  console.log("Token OK");

  const doc = await firestoreGet(token, `orders/${ORDER_ID}`);
  const data = parseDoc(doc);
  if (!data) { console.error("Order not found"); return; }
  console.log(`status=${data.status} pdfDone=${data.pdfDone} emailSent=${data.emailSent}`);

  console.log("Resetting pdfDone=false emailSent=false...");
  await firestorePatch(token, `orders/${ORDER_ID}`, {
    pdfDone:       { booleanValue: false },
    pdfGenerating: { booleanValue: false },
    emailSent:     { booleanValue: false },
  });
  console.log("Reset done");

  const payload = { ...data.payload, orderCode: parseInt(ORDER_ID) };
  console.log(`Calling generate-pdf for ${payload.HOTEN} <${payload.EMAIL}>...`);

  const result = await callGeneratePdf(payload);
  if (result.data?.success) {
    console.log("SUCCESS! Email sent to", payload.EMAIL);
  } else {
    console.error("FAILED:", result.data?.error || result.raw);
  }
}

run().catch(e => { console.error(e.message); process.exit(1); });
