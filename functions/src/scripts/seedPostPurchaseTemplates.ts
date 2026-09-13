/**
 * seedPostPurchaseTemplates.ts — Tạo 3 email templates post-purchase trong Firestore.
 *
 * Cách chạy:
 *   cd functions
 *   $env:GOOGLE_APPLICATION_CREDENTIALS="D:\NCN-Academy\functions\service-account.json"
 *   npx ts-node src/scripts/seedPostPurchaseTemplates.ts
 */

import "../lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

const templates: { id: string; subject: string; bodyHtml: string; delayDays: number }[] = [
  // ─── post_purchase_0 — Giao báo cáo ─────────────────────────────────────
  {
    id: "post_purchase_0",
    subject: "Báo cáo nghề nghiệp của bạn đã sẵn sàng! 🎉",
    delayDays: 1,
    bodyHtml: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <h2 style="color: #0e0e1a;">Chào {{name}},</h2>
  
  <p>Cảm ơn bạn đã tin tưởng Nghề Chọn Người! 🎉</p>
  
  <p>Báo cáo nghề nghiệp của bạn đã được tạo xong. Bạn có thể xem và tải về ngay tại đây:</p>
  
  <p style="text-align: center; margin: 25px 0;">
    <a href="https://quiz.nghechonnguoi.com/dashboard" 
       style="display: inline-block; background: #e8654a; color: white; padding: 12px 24px; 
              text-decoration: none; border-radius: 5px; font-weight: bold;">
      Xem báo cáo của bạn →
    </a>
  </p>
  
  <p>Báo cáo bao gồm:</p>
  <p>✅ Phân tích chi tiết năng lực và tính cách của bạn<br>
  ✅ Danh sách nghề nghiệp phù hợp nhất với lộ trình học tập<br>
  ✅ Điểm mạnh cần phát huy và điểm cần cải thiện</p>
  
  <p>Nếu có bất kỳ thắc mắc nào, bạn cứ reply email này — mình sẽ hỗ trợ ngay.</p>
  
  <p>Thân mến,<br>
  <strong>Nghề Chọn Người</strong></p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="color: #999; font-size: 12px;">
    <a href="https://nghechonnguoi.com/api/email/unsubscribe?email={{email}}" style="color: #999;">Huỷ nhận email</a>
  </p>
</div>`,
  },

  // ─── post_purchase_1 — Hướng dẫn đọc báo cáo ────────────────────────────
  {
    id: "post_purchase_1",
    subject: "Cách đọc báo cáo nghề nghiệp hiệu quả nhất 📖",
    delayDays: 2,
    bodyHtml: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <h2 style="color: #0e0e1a;">{{name}} ơi,</h2>
  
  <p>Bạn đã đọc báo cáo nghề nghiệp chưa? Mình muốn chia sẻ cách đọc để bạn khai thác được nhiều nhất:</p>
  
  <p><strong>Bước 1 — Đọc phần "Tổng quan năng lực" trước.</strong> Đây là bức tranh toàn cảnh về bạn. Đừng vội đánh giá đúng sai — hãy đọc với tâm thế khám phá.</p>
  
  <p><strong>Bước 2 — Xem danh sách nghề nghiệp phù hợp.</strong> Chú ý những nghề bạn chưa từng nghĩ đến — đôi khi sự bất ngờ lại là gợi ý tốt nhất.</p>
  
  <p><strong>Bước 3 — Chia sẻ với ba mẹ hoặc người thân.</strong> Báo cáo sẽ giúp ba mẹ hiểu bạn hơn và cùng bạn đưa ra quyết định phù hợp.</p>
  
  <p style="text-align: center; margin: 25px 0;">
    <a href="https://quiz.nghechonnguoi.com/dashboard" 
       style="display: inline-block; background: #e8654a; color: white; padding: 12px 24px; 
              text-decoration: none; border-radius: 5px; font-weight: bold;">
      Đọc lại báo cáo →
    </a>
  </p>
  
  <p>Thân mến,<br>
  <strong>Nghề Chọn Người</strong></p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="color: #999; font-size: 12px;">
    <a href="https://nghechonnguoi.com/api/email/unsubscribe?email={{email}}" style="color: #999;">Huỷ nhận email</a>
  </p>
</div>`,
  },

  // ─── post_purchase_2 — Affiliate / soft close ────────────────────────────
  {
    id: "post_purchase_2",
    subject: "Giới thiệu bạn bè — nhận hoa hồng 20% 🎁",
    delayDays: 0, // email cuối
    bodyHtml: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <h2 style="color: #0e0e1a;">{{name}} thân mến,</h2>
  
  <p>Mình hy vọng báo cáo nghề nghiệp đã giúp bạn có cái nhìn rõ ràng hơn về con đường phù hợp.</p>
  
  <p>Nếu bạn thấy Nghề Chọn Người hữu ích, mình có một lời mời đặc biệt:</p>
  
  <p>🎁 <strong>Giới thiệu bạn bè làm trắc nghiệm và mua báo cáo — bạn nhận hoa hồng 20% cho mỗi đơn hàng thành công.</strong></p>
  
  <p>Cách tham gia rất đơn giản:</p>
  <p>1. Đăng ký tài khoản affiliate tại link bên dưới<br>
  2. Nhận link giới thiệu riêng của bạn<br>
  3. Chia sẻ link cho bạn bè, nhóm lớp, group phụ huynh<br>
  4. Nhận hoa hồng khi có đơn hàng thành công</p>
  
  <p style="text-align: center; margin: 25px 0;">
    <a href="https://www.nghechonnguoi.com/dang-ky-affiliate.html" 
       style="display: inline-block; background: #e8654a; color: white; padding: 12px 24px; 
              text-decoration: none; border-radius: 5px; font-weight: bold;">
      Tham gia affiliate →
    </a>
  </p>
  
  <p>Cảm ơn bạn đã đồng hành cùng Nghề Chọn Người!</p>
  
  <p>Thân mến,<br>
  <strong>Nghề Chọn Người</strong></p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="color: #999; font-size: 12px;">
    <a href="https://nghechonnguoi.com/api/email/unsubscribe?email={{email}}" style="color: #999;">Huỷ nhận email</a>
  </p>
</div>`,
  },
];

async function seed() {
  const batch = db.batch();

  for (const t of templates) {
    const ref = db.collection("email_templates").doc(t.id);
    batch.set(ref, {
      subject: t.subject,
      bodyHtml: t.bodyHtml,
      delayDays: t.delayDays,
    });
    console.log("📧 Chuẩn bị tạo template:", t.id, "—", `"${t.subject}"`);
  }

  await batch.commit();
  console.log(`\n✅ Đã tạo ${templates.length} post-purchase email templates.`);
  console.log("Collection: email_templates");
  console.log("Documents: post_purchase_0, post_purchase_1, post_purchase_2");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Lỗi:", err);
  process.exit(1);
});
