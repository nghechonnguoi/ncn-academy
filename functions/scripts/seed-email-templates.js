/**
 * One-off script to populate the `email_templates` collection with placeholder
 * content so onLeadCreated / dailyNurtureSend have something to send while the
 * marketing team writes the real copy.
 *
 * Usage (from functions/):
 *   FIREBASE_SERVICE_ACCOUNT='<service-account-json>' node scripts/seed-email-templates.js
 */
const admin = require("firebase-admin");

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

const BRANCH_LABELS = {
  general: "Chung",
  realistic: "Realistic (Kỹ thuật - Thực tế)",
  investigative: "Investigative (Nghiên cứu - Phân tích)",
  artistic: "Artistic (Sáng tạo - Nghệ thuật)",
  social: "Social (Xã hội - Con người)",
  enterprising: "Enterprising (Kinh doanh - Lãnh đạo)",
  conventional: "Conventional (Tổ chức - Hành chính)",
};

const STEPS = [
  { step: 0, delayDays: 1 },
  { step: 1, delayDays: 2 },
  { step: 2, delayDays: 3 },
];

async function seed() {
  const batch = db.batch();

  for (const [branch, label] of Object.entries(BRANCH_LABELS)) {
    for (const { step, delayDays } of STEPS) {
      const docId = `${branch}_${step}`;
      const ref = db.collection("email_templates").doc(docId);
      batch.set(ref, {
        branch,
        step,
        delayDays,
        subject: `[PLACEHOLDER] ${label} - Email ${step + 1}`,
        bodyHtml: `<div style="font-family: sans-serif; line-height: 1.6; color: #333;">
  <h2 style="color: #4f46e5;">Chào {{name}},</h2>
  <p>[PLACEHOLDER] Đây là email #${step + 1} trong chuỗi nuôi dưỡng dành cho nhóm <strong>${label}</strong>.</p>
  <p>Nội dung này cần được đội ngũ content thay thế trước khi gửi thật.</p>
  <br/>
  <p>Trân trọng,<br/><strong>Đội ngũ NCN Academy</strong></p>
</div>`,
      });
    }
  }

  await batch.commit();
  console.log(`Seeded ${Object.keys(BRANCH_LABELS).length * STEPS.length} email_templates documents.`);
}

seed()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .then(() => process.exit(0));
