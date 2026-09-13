import "../lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";

async function main() {
  const db = getFirestore();
  
  // Check all orders
  const snap = await db.collection("orders").get();
  console.log("Total orders:", snap.size);
  
  const statuses: Record<string, number> = {};
  let pdfDoneTrue = 0, pdfDoneFalse = 0, pdfDoneUndef = 0;
  let samplePaid: any[] = [];
  
  for (const d of snap.docs) {
    const data = d.data();
    const st = String(data.status || "undefined");
    statuses[st] = (statuses[st] || 0) + 1;
    
    if (data.pdfDone === true) pdfDoneTrue++;
    else if (data.pdfDone === false) pdfDoneFalse++;
    else pdfDoneUndef++;
    
    if ((st === "PAID" || st === "paid") && samplePaid.length < 3) {
      samplePaid.push({ id: d.id, status: data.status, pdfDone: data.pdfDone, email: data.payload?.email, customerId: data.customerId });
    }
  }
  
  console.log("By status:", JSON.stringify(statuses, null, 2));
  console.log("pdfDone=true:", pdfDoneTrue);
  console.log("pdfDone=false:", pdfDoneFalse);
  console.log("pdfDone=undefined:", pdfDoneUndef);
  console.log("\nSample PAID orders:", JSON.stringify(samplePaid, null, 2));
  
  // Check customers - có pdfUrl hoặc pdfDone không
  const custSnap = await db.collection("customers").get();
  let hasPdfUrl = 0, hasPdfDone = 0;
  for (const d of custSnap.docs) {
    const data = d.data();
    if (data.pdfUrl) hasPdfUrl++;
    if (data.pdfDone) hasPdfDone++;
  }
  console.log("\nCustomers with pdfUrl:", hasPdfUrl);
  console.log("Customers with pdfDone:", hasPdfDone);
  
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
