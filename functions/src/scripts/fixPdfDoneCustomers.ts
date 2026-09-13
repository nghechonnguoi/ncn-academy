/**
 * fixPdfDoneCustomers.ts
 * Tìm các customers đã nhận PDF (orders.pdfDone=true) → tắt emailSequence của họ
 *
 * Cách chạy:
 *   cd functions
 *   $env:GOOGLE_APPLICATION_CREDENTIALS="D:\NCN-Academy\functions\service-account.json"
 *   npx ts-node src/scripts/fixPdfDoneCustomers.ts
 */

import "../lib/firebaseAdmin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

async function main() {
  const db = getFirestore();

  // Bước 1: Lấy tất cả orders PAID + pdfDone=true, map email → orderId
  console.log("📥 Đọc orders PAID + pdfDone=true...");
  const paidPdfSnap = await db.collection("orders")
    .where("status", "==", "PAID")
    .where("pdfDone", "==", true)
    .get();

  console.log(`   → ${paidPdfSnap.size} đơn đã giao PDF.`);

  // Gom các email đã nhận PDF từ orders
  const emailsWithPdf = new Set<string>();
  for (const d of paidPdfSnap.docs) {
    const data = d.data();
    // Email có thể nằm trong payload hoặc trực tiếp
    const email: string | undefined =
      data.email ||
      data.payload?.email ||
      data.customerEmail;
    if (email?.trim()) {
      emailsWithPdf.add(email.trim().toLowerCase());
    }
  }
  console.log(`   → ${emailsWithPdf.size} email duy nhất đã nhận PDF.`);
  if (emailsWithPdf.size > 0) {
    console.log("   Danh sách:", [...emailsWithPdf].join(", "));
  }

  // Bước 2: Tìm customers khớp email → tắt sequence
  console.log("\n📥 Đọc toàn bộ customers...");
  const custSnap = await db.collection("customers").get();

  const toStop: { id: string; name: string; email: string }[] = [];
  for (const d of custSnap.docs) {
    const data = d.data();
    const email: string | undefined = data.email?.trim().toLowerCase();
    if (email && emailsWithPdf.has(email)) {
      toStop.push({ id: d.id, name: data.fullName || data.name || "(không tên)", email });
    }
  }

  console.log(`\n🎯 Tìm thấy ${toStop.length} customers cần tắt sequence:`);
  for (const c of toStop) {
    console.log(`  • [${c.id}] ${c.name} <${c.email}>`);
  }

  if (toStop.length === 0) {
    console.log("\nℹ️  Không tìm thấy ai cần tắt. Kết thúc.");
    process.exit(0);
  }

  // Bước 3: Tắt sequence (set nextSendAt=null, đánh dấu sequenceType="completed")
  console.log(`\n🔄 Đang tắt sequence cho ${toStop.length} customers...`);
  const BATCH_SIZE = 490;
  let count = 0;

  for (let i = 0; i < toStop.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = toStop.slice(i, i + BATCH_SIZE);
    for (const c of chunk) {
      const ref = db.collection("customers").doc(c.id);
      batch.update(ref, {
        "emailSequence.nextSendAt": null,
        "emailSequence.sequenceType": "completed",
      });
    }
    await batch.commit();
    count += chunk.length;
    console.log(`  → Batch ${Math.floor(i / BATCH_SIZE) + 1}: đã tắt ${chunk.length} customers.`);
  }

  console.log(`
✅ Hoàn tất!
   Đã tắt email sequence cho ${count} customers đã nhận PDF.
   Họ sẽ không nhận thêm email nào từ chuỗi tự động.
`);
  process.exit(0);
}

main().catch(e => { console.error("❌ Lỗi:", e); process.exit(1); });
