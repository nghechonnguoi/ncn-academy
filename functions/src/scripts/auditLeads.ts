/**
 * auditLeads.ts — Script chạy 1 lần để rà soát & phân loại toàn bộ leads.
 *
 * Cách chạy:
 *   cd functions
 *   npx ts-node src/scripts/auditLeads.ts
 *
 * Yêu cầu: GOOGLE_APPLICATION_CREDENTIALS được set, hoặc chạy trong
 * môi trường đã authenticated với Firebase project.
 */

import "../lib/firebaseAdmin";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { mapHollandCodeToBranch } from "../lib/branch";
import * as readline from "readline";
import * as path from "path";
import * as XLSX from "xlsx";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(value: unknown): string {
  if (!value) return "";
  if (value instanceof Timestamp) {
    return value.toDate().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
  }
  if (value instanceof Date) {
    return value.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
  }
  return String(value);
}

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// ─── Kiểu dữ liệu ───────────────────────────────────────────────────────────

interface LeadGroupA {
  leadId: string;
  name: string;
  email: string;
  phone: string;
  hollandCode: string;
  purchaseDate: string;
  sequenceStatus: string;
}

interface LeadGroupB {
  leadId: string;
  name: string;
  email: string;
  phone: string;
  hollandCode: string;
  quizDate: string;
  sequenceStatus: string;
}

interface LeadGroupC {
  leadId: string;
  name: string;
  email: string;
  currentStep: number;
  nextSendAt: string;
}

interface LeadGroupD {
  leadId: string;
  name: string;
  email: string;
}

interface LeadGroupE {
  leadId: string;
  name: string;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const db = getFirestore();

  console.log("\n📥 Đang đọc collection leads từ Firestore...");
  const snapshot = await db.collection("leads").get();
  const total = snapshot.size;
  console.log(`   → ${total} leads tìm thấy.\n`);

  const groupA: LeadGroupA[] = [];
  const groupB: LeadGroupB[] = [];
  const groupC: LeadGroupC[] = [];
  const groupD: LeadGroupD[] = [];
  const groupE: LeadGroupE[] = [];

  for (const doc of snapshot.docs) {
    const lead = doc.data();
    const leadId = doc.id;
    const name: string = lead?.name || "(không tên)";
    const email: string | undefined = lead?.email;

    // ── Thứ tự ưu tiên: E → D → C → A → B ──

    // E — Không có email
    if (!email || email.trim() === "") {
      groupE.push({ leadId, name });
      continue;
    }

    // D — Đã unsubscribe
    if (lead?.emailSequence?.unsubscribed === true) {
      groupD.push({ leadId, name, email });
      continue;
    }

    // C — Đang trong sequence (nextSendAt != null)
    const nextSendAt = lead?.emailSequence?.nextSendAt;
    if (nextSendAt != null) {
      groupC.push({
        leadId,
        name,
        email,
        currentStep: lead?.emailSequence?.currentStep ?? 0,
        nextSendAt: formatDate(nextSendAt),
      });
      continue;
    }

    // A — Đã mua
    if (lead?.purchases?.coursePurchased === true) {
      groupA.push({
        leadId,
        name,
        email,
        phone: lead?.phone || "",
        hollandCode: lead?.quizResult?.hollandCode || "",
        purchaseDate: formatDate(lead?.purchases?.purchaseDate),
        sequenceStatus: lead?.emailSequence?.sequenceType || "chưa có",
      });
      continue;
    }

    // B — Có Holland Code, chưa mua
    const hollandCode: string | undefined = lead?.quizResult?.hollandCode;
    if (hollandCode) {
      groupB.push({
        leadId,
        name,
        email,
        phone: lead?.phone || "",
        hollandCode,
        quizDate: formatDate(lead?.quizResult?.completedAt),
        sequenceStatus: lead?.emailSequence?.sequenceType || "chưa có",
      });
      continue;
    }

    // Không thuộc nhóm nào rõ ràng → xem như chưa có email sequence hợp lệ, bỏ qua
    // (lead có email nhưng chưa làm quiz và chưa mua — ghi vào nhóm E phụ)
    groupE.push({ leadId, name });
  }

  const totalWillAssign = groupA.length + groupB.length;

  // ─── In bảng tổng hợp ────────────────────────────────────────────────────

  console.log("=== BÁO CÁO RÀ SOÁT LEADS ===");
  console.log(`Tổng leads: ${total}`);
  console.log("─────────────────────────────────");
  console.log(`Nhóm A — Đã mua:                  ${groupA.length} leads`);
  console.log(`Nhóm B — Quiz xong, chưa mua:     ${groupB.length} leads  ← GÁN post_quiz_nurture`);
  console.log(`Nhóm C — Đang trong sequence:     ${groupC.length} leads  ← BỎ QUA`);
  console.log(`Nhóm D — Đã unsubscribe:          ${groupD.length} leads  ← BỎ QUA`);
  console.log(`Nhóm E — Không có email:          ${groupE.length} leads  ← BỎ QUA`);
  console.log("─────────────────────────────────");
  console.log(`Tổng sẽ gán sequence mới:         ${totalWillAssign} leads`);

  // ─── Chi tiết nhóm A ─────────────────────────────────────────────────────

  if (groupA.length > 0) {
    console.log("\n── Nhóm A — Đã mua (sẽ gán post_purchase) ──");
    for (const lead of groupA) {
      console.log(
        `  • [${lead.leadId}] ${lead.name} <${lead.email}> | Holland: ${lead.hollandCode || "N/A"} | Mua: ${lead.purchaseDate || "N/A"}`
      );
    }
  }

  // ─── Chi tiết nhóm B ─────────────────────────────────────────────────────

  if (groupB.length > 0) {
    console.log("\n── Nhóm B — Quiz xong, chưa mua (sẽ gán post_quiz_nurture) ──");
    for (const lead of groupB) {
      console.log(
        `  • [${lead.leadId}] ${lead.name} <${lead.email}> | Holland: ${lead.hollandCode} | Quiz: ${lead.quizDate || "N/A"}`
      );
    }
  }

  // ─── Xuất Excel ──────────────────────────────────────────────────────────

  const outputPath = path.resolve(__dirname, "../../leads-audit.xlsx");
  console.log(`\n📊 Đang xuất Excel → ${outputPath}`);

  const wb = XLSX.utils.book_new();

  // Sheet: Tổng hợp
  const summaryData = [
    ["BÁO CÁO RÀ SOÁT LEADS"],
    [`Tổng leads: ${total}`],
    [],
    ["Nhóm", "Số leads", "Ghi chú"],
    ["A — Đã mua", groupA.length, "Sẽ gán post_purchase"],
    ["B — Quiz xong, chưa mua", groupB.length, "Sẽ gán post_quiz_nurture"],
    ["C — Đang trong sequence", groupC.length, "Bỏ qua"],
    ["D — Đã unsubscribe", groupD.length, "Bỏ qua"],
    ["E — Không có email", groupE.length, "Bỏ qua"],
    [],
    ["Tổng sẽ gán sequence mới", totalWillAssign],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), "Tổng hợp");

  // Sheet: Nhóm A
  const sheetA = XLSX.utils.json_to_sheet(
    groupA.map((l) => ({
      leadId: l.leadId,
      name: l.name,
      email: l.email,
      phone: l.phone,
      hollandCode: l.hollandCode,
      purchaseDate: l.purchaseDate,
      "emailSequence.sequenceType": l.sequenceStatus,
    }))
  );
  XLSX.utils.book_append_sheet(wb, sheetA, "Nhóm A - Đã mua");

  // Sheet: Nhóm B
  const sheetB = XLSX.utils.json_to_sheet(
    groupB.map((l) => ({
      leadId: l.leadId,
      name: l.name,
      email: l.email,
      phone: l.phone,
      hollandCode: l.hollandCode,
      quizDate: l.quizDate,
      "emailSequence.sequenceType": l.sequenceStatus,
    }))
  );
  XLSX.utils.book_append_sheet(wb, sheetB, "Nhóm B - Chưa mua");

  // Sheet: Nhóm C
  const sheetC = XLSX.utils.json_to_sheet(
    groupC.map((l) => ({
      leadId: l.leadId,
      name: l.name,
      email: l.email,
      currentStep: l.currentStep,
      nextSendAt: l.nextSendAt,
    }))
  );
  XLSX.utils.book_append_sheet(wb, sheetC, "Nhóm C - Đang chạy");

  // Sheet: Nhóm D
  const sheetD = XLSX.utils.json_to_sheet(
    groupD.map((l) => ({ leadId: l.leadId, name: l.name, email: l.email }))
  );
  XLSX.utils.book_append_sheet(wb, sheetD, "Nhóm D - Unsubscribed");

  // Sheet: Nhóm E
  const sheetE = XLSX.utils.json_to_sheet(
    groupE.map((l) => ({ leadId: l.leadId, name: l.name }))
  );
  XLSX.utils.book_append_sheet(wb, sheetE, "Nhóm E - Không email");

  XLSX.writeFile(wb, outputPath);
  console.log(`✅ Đã xuất Excel thành công.`);

  // ─── Hỏi xác nhận ────────────────────────────────────────────────────────

  if (totalWillAssign === 0) {
    console.log("\nℹ️  Không có lead nào cần gán sequence. Kết thúc.\n");
    process.exit(0);
  }

  const answer = await ask(
    `\nBạn có muốn gán email sequence cho ${totalWillAssign} leads? (y/n): `
  );

  if (answer.toLowerCase() !== "y") {
    console.log("❌ Đã hủy. Không có gì được ghi vào Firestore.\n");
    process.exit(0);
  }

  // ─── Gán sequence — Nhóm A (post_purchase) ───────────────────────────────

  console.log(`\n🔄 Đang gán post_purchase cho ${groupA.length} leads (Nhóm A)...`);
  let countA = 0;

  // Batch write tối đa 500 docs/batch
  const batchSize = 500;
  for (let i = 0; i < groupA.length; i += batchSize) {
    const batch = db.batch();
    const chunk = groupA.slice(i, i + batchSize);

    for (const lead of chunk) {
      const leadRef = db.collection("leads").doc(lead.leadId);
      const branch = mapHollandCodeToBranch(lead.hollandCode);
      batch.update(leadRef, {
        "emailSequence.branch": branch,
        "emailSequence.currentStep": 0,
        "emailSequence.lastSentAt": null,
        "emailSequence.nextSendAt": Timestamp.fromMillis(
          Date.now() + 1 * 24 * 60 * 60 * 1000 // gửi sau 1 ngày
        ),
        "emailSequence.unsubscribed": false,
        "emailSequence.sequenceType": "post_purchase",
      });
      console.log(`   ✓ [A] ${lead.name} <${lead.email}> → branch="${branch}"`);
    }

    await batch.commit();
    countA += chunk.length;
    console.log(`   → Batch ${Math.floor(i / batchSize) + 1}: đã commit ${chunk.length} docs.`);
  }

  // ─── Gán sequence — Nhóm B (post_quiz_nurture) ───────────────────────────

  console.log(`\n🔄 Đang gán post_quiz_nurture cho ${groupB.length} leads (Nhóm B)...`);
  let countB = 0;

  for (let i = 0; i < groupB.length; i += batchSize) {
    const batch = db.batch();
    const chunk = groupB.slice(i, i + batchSize);

    for (const lead of chunk) {
      const leadRef = db.collection("leads").doc(lead.leadId);
      const branch = mapHollandCodeToBranch(lead.hollandCode);
      batch.update(leadRef, {
        "emailSequence.branch": branch,
        "emailSequence.currentStep": 0,
        "emailSequence.lastSentAt": null,
        "emailSequence.nextSendAt": Timestamp.fromMillis(
          Date.now() + 2 * 60 * 60 * 1000 // gửi sau 2 giờ
        ),
        "emailSequence.unsubscribed": false,
        "emailSequence.sequenceType": "post_quiz_nurture",
      });
      console.log(`   ✓ [B] ${lead.name} <${lead.email}> → branch="${branch}"`);
    }

    await batch.commit();
    countB += chunk.length;
    console.log(`   → Batch ${Math.floor(i / batchSize) + 1}: đã commit ${chunk.length} docs.`);
  }

  // ─── Kết quả ─────────────────────────────────────────────────────────────

  console.log(`
✅ Đã gán sequence cho ${countA + countB} leads.
- Nhóm A (post_purchase):     ${countA} leads — email đầu tiên gửi sau 1 ngày
- Nhóm B (post_quiz_nurture): ${countB} leads — email đầu tiên gửi sau 2 giờ
`);

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Lỗi:", err);
  process.exit(1);
});
