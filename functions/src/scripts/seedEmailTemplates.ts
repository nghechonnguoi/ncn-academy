/**
 * seedEmailTemplates.ts — Tạo 5 email templates trong Firestore.
 *
 * Cách chạy:
 *   cd functions
 *   $env:GOOGLE_APPLICATION_CREDENTIALS="D:\NCN-Academy\functions\service-account.json.json"
 *   npx ts-node src/scripts/seedEmailTemplates.ts
 */

import "../lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

const templates: { id: string; subject: string; bodyHtml: string; delayDays: number }[] = [
  // ─── general_0 — Welcome ─────────────────────────────────────────────────
  {
    id: "general_0",
    subject: "Chào mừng bạn đến với Nghề Chọn Người! 🎯",
    delayDays: 1,
    bodyHtml: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <h2 style="color: #0e0e1a;">Chào {{name}},</h2>
  
  <p>Cảm ơn bạn đã hoàn thành bài trắc nghiệm Nghề Chọn Người! 🎉</p>
  
  <p>Mình rất vui vì bạn đã dành thời gian khám phá bản thân. Kết quả của bạn đã sẵn sàng — và mình tin rằng nó sẽ mở ra nhiều góc nhìn mới về nghề nghiệp phù hợp với bạn.</p>
  
  <p>Bạn có thể xem tóm tắt kết quả ngay tại đây:</p>
  
  <p style="text-align: center; margin: 25px 0;">
    <a href="https://quiz.nghechonnguoi.com/dashboard" 
       style="display: inline-block; background: #e8654a; color: white; padding: 12px 24px; 
              text-decoration: none; border-radius: 5px; font-weight: bold;">
      Xem kết quả của bạn →
    </a>
  </p>
  
  <p>Nếu bạn muốn hiểu sâu hơn về bản thân — bao gồm phân tích chi tiết năng lực, tính cách, và danh sách nghề nghiệp phù hợp nhất — <strong>Báo cáo nghề nghiệp Nghề Chọn Người</strong> sẽ giúp bạn có câu trả lời rõ ràng.</p>
  
  <p>Hẹn gặp lại trong email tiếp theo!</p>
  
  <p>Thân mến,<br>
  <strong>Nghề Chọn Người</strong></p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="color: #999; font-size: 12px;">
    Bạn nhận email này vì đã làm bài trắc nghiệm tại nghechonnguoi.com.<br>
    <a href="https://nghechonnguoi.com/api/email/unsubscribe?email={{email}}" style="color: #999;">Huỷ nhận email</a>
  </p>
</div>`,
  },

  // ─── general_1 — Nurture 1: Nhắc kết quả, tạo tò mò ─────────────────────
  {
    id: "general_1",
    subject: "Kết quả nghề nghiệp của bạn — bạn có bất ngờ không? 🤔",
    delayDays: 2,
    bodyHtml: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <h2 style="color: #0e0e1a;">{{name}} ơi,</h2>
  
  <p>Hôm trước bạn đã làm bài trắc nghiệm Nghề Chọn Người — bạn có bất ngờ với kết quả không?</p>
  
  <p>Nhiều bạn sau khi xem tóm tắt kết quả đều nói: <em>"Ơ, sao đúng quá vậy!"</em> hoặc <em>"Mình chưa bao giờ nghĩ theo hướng này."</em></p>
  
  <p>Nhưng bạn biết không? Trang tóm tắt chỉ cho bạn thấy <strong>một phần nhỏ</strong> bức tranh. Báo cáo nghề nghiệp đầy đủ sẽ cho bạn thấy:</p>
  
  <p>✅ Phân tích chi tiết 3 nhóm năng lực nổi bật nhất của bạn<br>
  ✅ Danh sách nghề nghiệp phù hợp — có cả lộ trình học tập<br>
  ✅ Điểm mạnh cần phát huy và điểm cần cải thiện</p>
  
  <p style="text-align: center; margin: 25px 0;">
    <a href="https://quiz.nghechonnguoi.com/dashboard" 
       style="display: inline-block; background: #e8654a; color: white; padding: 12px 24px; 
              text-decoration: none; border-radius: 5px; font-weight: bold;">
      Xem báo cáo đầy đủ →
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

  // ─── general_2 — Nurture 2: Insight miễn phí ─────────────────────────────
  {
    id: "general_2",
    subject: "3 sai lầm khi chọn nghề mà 80% học sinh mắc phải",
    delayDays: 2,
    bodyHtml: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <h2 style="color: #0e0e1a;">{{name}} thân mến,</h2>
  
  <p>Sau nhiều năm tư vấn hướng nghiệp, mình nhận ra có 3 sai lầm mà phần lớn học sinh (và cả phụ huynh) đều mắc phải khi chọn nghề:</p>
  
  <p><strong>1. Chọn nghề theo trào lưu.</strong> "Ngành IT đang hot" — nhưng hot với người khác chưa chắc hợp với bạn. Mỗi người có một bộ năng lực khác nhau.</p>
  
  <p><strong>2. Chỉ hỏi ý kiến người xung quanh.</strong> Ba mẹ, thầy cô đều muốn tốt cho bạn — nhưng không ai hiểu bạn bằng chính bạn. Điều bạn cần là dữ liệu khách quan về bản thân.</p>
  
  <p><strong>3. Không phân biệt "thích" và "phù hợp".</strong> Thích vẽ không có nghĩa là nên học mỹ thuật. Phù hợp là khi năng lực, tính cách và giá trị sống của bạn đều khớp với yêu cầu nghề nghiệp.</p>
  
  <p>Báo cáo Nghề Chọn Người giúp bạn tránh cả 3 sai lầm này — bằng cách phân tích khoa học năng lực thật sự của bạn.</p>
  
  <p style="text-align: center; margin: 25px 0;">
    <a href="https://quiz.nghechonnguoi.com/dashboard" 
       style="display: inline-block; background: #e8654a; color: white; padding: 12px 24px; 
              text-decoration: none; border-radius: 5px; font-weight: bold;">
      Nhận báo cáo nghề nghiệp →
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

  // ─── general_3 — Nurture 3: Social proof ─────────────────────────────────
  {
    id: "general_3",
    subject: "Bạn Minh Anh đã chọn đúng nghề nhờ báo cáo này 💬",
    delayDays: 2,
    bodyHtml: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <h2 style="color: #0e0e1a;">{{name}} ơi,</h2>
  
  <p>Mình muốn chia sẻ với bạn câu chuyện của Minh Anh — một bạn học sinh lớp 12 ở Thanh Hoá.</p>
  
  <p>Trước khi làm trắc nghiệm, Minh Anh định thi vào ngành Quản trị kinh doanh vì "nghe có vẻ ổn" và ba mẹ cũng đồng ý. Nhưng sau khi đọc báo cáo Nghề Chọn Người, bạn ấy nhận ra mình thực sự phù hợp với nhóm nghề thiên về sáng tạo và giao tiếp hơn.</p>
  
  <p>Minh Anh quyết định tìm hiểu thêm các ngành truyền thông — và bây giờ bạn ấy đang rất hào hứng với lựa chọn của mình.</p>
  
  <p>Minh Anh nói: <em>"Em không nghĩ một bài trắc nghiệm có thể cho em thấy rõ bản thân đến vậy. Nếu không có báo cáo, chắc em đã chọn sai nghề."</em></p>
  
  <p>Bạn cũng xứng đáng có một lựa chọn nghề nghiệp dựa trên hiểu biết thật sự về bản thân — không phải dựa trên may rủi.</p>
  
  <p style="text-align: center; margin: 25px 0;">
    <a href="https://quiz.nghechonnguoi.com/dashboard" 
       style="display: inline-block; background: #e8654a; color: white; padding: 12px 24px; 
              text-decoration: none; border-radius: 5px; font-weight: bold;">
      Nhận báo cáo của bạn — 799,000đ →
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

  // ─── general_4 — Nurture 4: Soft close ───────────────────────────────────
  {
    id: "general_4",
    subject: "Nghề Chọn Người vẫn ở đây khi bạn sẵn sàng 💛",
    delayDays: 0, // email cuối, không schedule tiếp
    bodyHtml: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <h2 style="color: #0e0e1a;">{{name}} thân mến,</h2>
  
  <p>Đây là email cuối cùng trong chuỗi email mình gửi cho bạn. Mình không muốn làm phiền bạn thêm nữa. 😊</p>
  
  <p>Mình hiểu rằng mỗi người có thời điểm riêng để đưa ra quyết định về nghề nghiệp. Có bạn cần vài ngày, có bạn cần vài tháng — và điều đó hoàn toàn bình thường.</p>
  
  <p>Mình chỉ muốn bạn biết:</p>
  
  <p>📌 Kết quả trắc nghiệm của bạn vẫn được lưu lại<br>
  📌 Bạn có thể quay lại xem bất cứ lúc nào<br>
  📌 Báo cáo nghề nghiệp luôn sẵn sàng khi bạn cần</p>
  
  <p style="text-align: center; margin: 25px 0;">
    <a href="https://quiz.nghechonnguoi.com/dashboard" 
       style="display: inline-block; background: #e8654a; color: white; padding: 12px 24px; 
              text-decoration: none; border-radius: 5px; font-weight: bold;">
      Xem lại kết quả của bạn →
    </a>
  </p>
  
  <p>Chúc bạn luôn tìm được con đường phù hợp nhất.</p>
  
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
    console.log(`📧 Chuẩn bị tạo template: ${t.id} — "${t.subject}"`);
  }

  await batch.commit();
  console.log(`\n✅ Đã tạo ${templates.length} email templates trong Firestore.`);
  console.log("Collection: email_templates");
  console.log("Documents: general_0, general_1, general_2, general_3, general_4");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Lỗi:", err);
  process.exit(1);
});
