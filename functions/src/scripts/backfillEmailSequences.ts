/**
 * backfillEmailSequences.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Rà soát TOÀN BỘ leads + customers trong Firestore, phân loại, rồi:
 *   1. In báo cáo chi tiết
 *   2. Xuất Excel
 *   3. (sau khi xác nhận) gửi email step-0 ngay + gán sequence cho tất cả
 *      người chưa có email sequence hợp lệ
 *
 * Cách chạy:
 *   cd functions
 *   $env:GOOGLE_APPLICATION_CREDENTIALS="D:\NCN-Academy\functions\service-account.json"
 *   npx ts-node src/scripts/backfillEmailSequences.ts
 */

import "../lib/firebaseAdmin";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { defineSecret } from "firebase-functions/params";
import { mapHollandCodeToBranch, DEFAULT_BRANCH } from "../lib/branch";
import { sendTemplateEmail } from "../lib/resend";
import { renderTemplate } from "../lib/template";
import * as readline from "readline";
import * as path from "path";
import * as XLSX from "xlsx";

// ─── Config ──────────────────────────────────────────────────────────────────

// Đọc RESEND_API_KEY từ env hoặc file .env.local
import * as dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../../../apps/web/.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";

if (!RESEND_API_KEY) {
  console.error("❌ Thiếu RESEND_API_KEY trong environment variables.");
  process.exit(1);
}

const BATCH_SIZE = 490;
const SEND_DELAY_MS = 200; // 200ms giữa các email để tránh rate limit

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Phân loại ───────────────────────────────────────────────────────────────

type Collection = "leads" | "customers";

interface RecordBase {
  id: string;
  collection: Collection;
  name: string;
  email: string;
  phone: string;
  hollandCode: string;
}

// Nhóm 1: Cần gán post_purchase (leads + customers đã mua, CHƯA có sequence)
interface Group1 extends RecordBase { purchaseDate: string; }
// Nhóm 2: Cần gán nurture (leads chưa mua, có hollandCode, CHƯA có sequence)
interface Group2 extends RecordBase { quizDate: string; }
// Nhóm 3: Đang chạy sequence (skip)
interface Group3 extends RecordBase { currentStep: number; sequenceType: string; nextSendAt: string; }
// Nhóm 4: Đã unsubscribe (skip)
interface Group4 extends RecordBase {}
// Nhóm 5: Không có email (skip)
interface Group5 { id: string; collection: Collection; name: string; }

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const db = getFirestore();

  const group1: Group1[] = [];
  const group2: Group2[] = [];
  const group3: Group3[] = [];
  const group4: Group4[] = [];
  const group5: Group5[] = [];

  // ── Đọc CUSTOMERS ──
  console.log("\n📥 Đang đọc collection customers...");
  const customersSnap = await db.collection("customers").get();
  console.log(`   → ${customersSnap.size} customers tìm thấy.`);

  for (const doc of customersSnap.docs) {
    const d = doc.data();
    const id = doc.id;
    const name: string = d?.fullName || d?.name || "(không tên)";
    const email: string | undefined = d?.email;

    if (!email?.trim()) {
      group5.push({ id, collection: "customers", name });
      continue;
    }
    if (d?.emailSequence?.unsubscribed === true) {
      group4.push({ id, collection: "customers", name, email, phone: d?.phone || "", hollandCode: "" });
      continue;
    }
    if (d?.emailSequence?.nextSendAt != null) {
      group3.push({
        id, collection: "customers", name, email,
        phone: d?.phone || "", hollandCode: "",
        currentStep: d?.emailSequence?.currentStep ?? 0,
        sequenceType: d?.emailSequence?.sequenceType || "?",
        nextSendAt: formatDate(d?.emailSequence?.nextSendAt),
      });
      continue;
    }
    // Customer → luôn post_purchase
    group1.push({
      id, collection: "customers", name, email,
      phone: d?.phone || "", hollandCode: "",
      purchaseDate: formatDate(d?.createdAt),
    });
  }

  // ── Đọc LEADS ──
  console.log("\n📥 Đang đọc collection leads...");
  const leadsSnap = await db.collection("leads").get();
  console.log(`   → ${leadsSnap.size} leads tìm thấy.`);

  for (const doc of leadsSnap.docs) {
    const d = doc.data();
    const id = doc.id;
    const name: string = d?.name || d?.fullName || "(không tên)";
    const email: string | undefined = d?.email;

    if (!email?.trim()) {
      group5.push({ id, collection: "leads", name });
      continue;
    }
    if (d?.emailSequence?.unsubscribed === true) {
      group4.push({ id, collection: "leads", name, email, phone: d?.phone || "", hollandCode: d?.quizResult?.hollandCode || "" });
      continue;
    }
    if (d?.emailSequence?.nextSendAt != null) {
      group3.push({
        id, collection: "leads", name, email,
        phone: d?.phone || "", hollandCode: d?.quizResult?.hollandCode || "",
        currentStep: d?.emailSequence?.currentStep ?? 0,
        sequenceType: d?.emailSequence?.sequenceType || "?",
        nextSendAt: formatDate(d?.emailSequence?.nextSendAt),
      });
      continue;
    }
    if (d?.purchases?.coursePurchased === true || d?.purchases?.pdfPurchased === true) {
      group1.push({
        id, collection: "leads", name, email,
        phone: d?.phone || "", hollandCode: d?.quizResult?.hollandCode || "",
        purchaseDate: formatDate(d?.purchases?.purchaseDate),
      });
      continue;
    }
    if (d?.quizResult?.hollandCode) {
      group2.push({
        id, collection: "leads", name, email,
        phone: d?.phone || "", hollandCode: d?.quizResult?.hollandCode,
        quizDate: formatDate(d?.quizResult?.completedAt),
      });
      continue;
    }
    // Lead có email nhưng không có hollandCode và chưa mua → skip
    group5.push({ id, collection: "leads", name });
  }

  const totalWillSend = group1.length + group2.length;

  // ─── In báo cáo ───────────────────────────────────────────────────────────

  const totalAll = customersSnap.size + leadsSnap.size;
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║       BÁO CÁO RÀ SOÁT EMAIL TOÀN HỆ THỐNG      ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log(`Customers: ${customersSnap.size}  |  Leads: ${leadsSnap.size}  |  Tổng: ${totalAll}`);
  console.log("──────────────────────────────────────────────────");
  console.log(`Nhóm 1 — Cần gán post_purchase:   ${group1.length.toString().padStart(4)} người  ← SẼ GỬI EMAIL`);
  console.log(`Nhóm 2 — Cần gán nurture:         ${group2.length.toString().padStart(4)} người  ← SẼ GỬI EMAIL`);
  console.log(`Nhóm 3 — Đang chạy sequence:      ${group3.length.toString().padStart(4)} người  ← BỎ QUA`);
  console.log(`Nhóm 4 — Đã unsubscribe:          ${group4.length.toString().padStart(4)} người  ← BỎ QUA`);
  console.log(`Nhóm 5 — Thiếu email/quiz:        ${group5.length.toString().padStart(4)} người  ← BỎ QUA`);
  console.log("──────────────────────────────────────────────────");
  console.log(`TỔNG SẼ GỬI EMAIL:                ${totalWillSend.toString().padStart(4)} người`);

  if (group1.length > 0) {
    console.log("\n── Nhóm 1 — post_purchase ──");
    for (const r of group1) {
      console.log(`  [${r.collection}] ${r.name} <${r.email}>`);
    }
  }
  if (group2.length > 0) {
    console.log("\n── Nhóm 2 — nurture (general) ──");
    for (const r of group2) {
      console.log(`  [${r.collection}] ${r.name} <${r.email}> | Holland: ${r.hollandCode}`);
    }
  }

  // ─── Xuất Excel ──────────────────────────────────────────────────────────

  const outputPath = path.resolve(__dirname, "../../backfill-report.xlsx");
  const wb = XLSX.utils.book_new();

  const summarySheet = XLSX.utils.aoa_to_sheet([
    ["BÁO CÁO RÀ SOÁT EMAIL TOÀN HỆ THỐNG"],
    [`Customers: ${customersSnap.size} | Leads: ${leadsSnap.size} | Tổng: ${totalAll}`],
    [],
    ["Nhóm", "Số người", "Hành động"],
    ["1 — post_purchase (chưa có sequence)", group1.length, "GỬI EMAIL + GÁN SEQUENCE"],
    ["2 — nurture (chưa có sequence)",       group2.length, "GỬI EMAIL + GÁN SEQUENCE"],
    ["3 — Đang chạy sequence",               group3.length, "Bỏ qua"],
    ["4 — Đã unsubscribe",                   group4.length, "Bỏ qua"],
    ["5 — Thiếu email/quiz",                 group5.length, "Bỏ qua"],
    [],
    ["TỔNG SẼ GỬI", totalWillSend],
  ]);
  XLSX.utils.book_append_sheet(wb, summarySheet, "Tổng hợp");

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(group1.map(r => ({
    collection: r.collection, id: r.id, name: r.name, email: r.email, phone: r.phone,
    hollandCode: r.hollandCode, purchaseDate: r.purchaseDate, action: "post_purchase",
  }))), "Nhóm 1 - post_purchase");

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(group2.map(r => ({
    collection: r.collection, id: r.id, name: r.name, email: r.email, phone: r.phone,
    hollandCode: r.hollandCode, quizDate: r.quizDate, action: "nurture",
  }))), "Nhóm 2 - nurture");

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(group3.map(r => ({
    collection: r.collection, id: r.id, name: r.name, email: r.email,
    sequenceType: r.sequenceType, currentStep: r.currentStep, nextSendAt: r.nextSendAt,
  }))), "Nhóm 3 - Đang chạy");

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(group4.map(r => ({
    collection: r.collection, id: r.id, name: r.name, email: r.email,
  }))), "Nhóm 4 - Unsubscribed");

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(group5.map(r => ({
    collection: r.collection, id: r.id, name: r.name,
  }))), "Nhóm 5 - Thiếu info");

  XLSX.writeFile(wb, outputPath);
  console.log(`\n📊 Đã xuất Excel → ${outputPath}`);

  // ─── Xác nhận ────────────────────────────────────────────────────────────

  if (totalWillSend === 0) {
    console.log("\nℹ️  Không có ai cần gửi email. Kết thúc.\n");
    process.exit(0);
  }

  const answer = await ask(
    `\n⚡ Gửi ngay welcome email (step 0) + gán sequence cho ${totalWillSend} người? (y/n): `
  );
  if (answer.toLowerCase() !== "y") {
    console.log("❌ Đã hủy. Không có gì được ghi vào Firestore.\n");
    process.exit(0);
  }

  // ─── Gửi email + gán sequence ────────────────────────────────────────────

  let sentOk = 0;
  let sentFail = 0;
  const now = Timestamp.now();

  // Helper: lấy template từ Firestore
  async function getTemplate(prefix: string, step: number) {
    let snap = await db.collection("email_templates").doc(`${prefix}_${step}`).get();
    if (!snap.exists && prefix !== DEFAULT_BRANCH) {
      snap = await db.collection("email_templates").doc(`${DEFAULT_BRANCH}_${step}`).get();
    }
    return snap.exists ? snap.data() as { subject?: string; bodyHtml?: string; delayDays?: number } : null;
  }

  // ── Nhóm 1: post_purchase ──
  console.log(`\n📨 Gửi email post_purchase cho ${group1.length} người...`);
  const template1 = await getTemplate("post_purchase", 0);

  for (let i = 0; i < group1.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = group1.slice(i, i + BATCH_SIZE);

    for (const r of chunk) {
      const vars = { name: r.name, email: r.email };
      let emailSent = false;

      if (template1) {
        try {
          await sendTemplateEmail({
            apiKey: RESEND_API_KEY,
            to: r.email,
            subject: renderTemplate(template1.subject || "", vars),
            html: renderTemplate(template1.bodyHtml || "", vars),
          });
          sentOk++;
          emailSent = true;
          process.stdout.write(`  ✅ [${r.collection}] ${r.name} <${r.email}>\n`);
        } catch (err: any) {
          sentFail++;
          process.stdout.write(`  ❌ [${r.collection}] ${r.name} <${r.email}> — ${err?.message}\n`);
        }
        await sleep(SEND_DELAY_MS);
      }

      const branch = mapHollandCodeToBranch(r.hollandCode);
      const delayDays = template1?.delayDays ?? 1;
      const nextSendAt = Timestamp.fromMillis(now.toMillis() + delayDays * 24 * 60 * 60 * 1000);

      const ref = db.collection(r.collection).doc(r.id);
      batch.update(ref, {
        "emailSequence.branch": branch,
        "emailSequence.currentStep": emailSent ? 1 : 0,
        "emailSequence.lastSentAt": emailSent ? now : null,
        "emailSequence.nextSendAt": emailSent ? nextSendAt : Timestamp.fromMillis(now.toMillis() + 2 * 60 * 60 * 1000),
        "emailSequence.unsubscribed": false,
        "emailSequence.sequenceType": "post_purchase",
      });
    }

    await batch.commit();
    console.log(`  → Batch ${Math.floor(i / BATCH_SIZE) + 1}: commit ${chunk.length} docs.`);
  }

  // ── Nhóm 2: nurture ──
  console.log(`\n📨 Gửi email nurture (general) cho ${group2.length} người...`);

  for (let i = 0; i < group2.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = group2.slice(i, i + BATCH_SIZE);

    for (const r of chunk) {
      const branch = mapHollandCodeToBranch(r.hollandCode);
      const template2 = await getTemplate(branch, 0);
      const vars = { name: r.name, email: r.email };
      let emailSent = false;

      if (template2) {
        try {
          await sendTemplateEmail({
            apiKey: RESEND_API_KEY,
            to: r.email,
            subject: renderTemplate(template2.subject || "", vars),
            html: renderTemplate(template2.bodyHtml || "", vars),
          });
          sentOk++;
          emailSent = true;
          process.stdout.write(`  ✅ [${r.collection}] ${r.name} <${r.email}> | branch=${branch}\n`);
        } catch (err: any) {
          sentFail++;
          process.stdout.write(`  ❌ [${r.collection}] ${r.name} <${r.email}> — ${err?.message}\n`);
        }
        await sleep(SEND_DELAY_MS);
      }

      const delayDays = template2?.delayDays ?? 1;
      const nextSendAt = Timestamp.fromMillis(now.toMillis() + delayDays * 24 * 60 * 60 * 1000);

      const ref = db.collection(r.collection).doc(r.id);
      batch.update(ref, {
        "emailSequence.branch": branch,
        "emailSequence.currentStep": emailSent ? 1 : 0,
        "emailSequence.lastSentAt": emailSent ? now : null,
        "emailSequence.nextSendAt": emailSent ? nextSendAt : Timestamp.fromMillis(now.toMillis() + 2 * 60 * 60 * 1000),
        "emailSequence.unsubscribed": false,
        "emailSequence.sequenceType": "nurture",
      });
    }

    await batch.commit();
    console.log(`  → Batch ${Math.floor(i / BATCH_SIZE) + 1}: commit ${chunk.length} docs.`);
  }

  // ─── Kết quả cuối ─────────────────────────────────────────────────────────

  console.log(`
╔══════════════════════════════════════════╗
║              KẾT QUẢ HOÀN TẤT           ║
╚══════════════════════════════════════════╝
  ✅ Gửi email thành công: ${sentOk}
  ❌ Gửi thất bại:        ${sentFail}
  📋 Tổng gán sequence:   ${totalWillSend}

  Chuỗi email tiếp theo sẽ được gửi tự động
  bởi Cloud Scheduler lúc 9:00 AM mỗi ngày.
`);

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Lỗi:", err);
  process.exit(1);
});
