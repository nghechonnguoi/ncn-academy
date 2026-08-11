import "./lib/firebaseAdmin";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions/v2";
import { defineSecret } from "firebase-functions/params";
import { sendTemplateEmail } from "./lib/resend";

const RESEND_API_KEY = defineSecret("RESEND_API_KEY");

const ADMIN_EMAIL = "tuvanhuongnghiepchonnghe@gmail.com";

/**
 * Fires when a new document is created in `leads/{leadId}`.
 * Sends admin notification email — replaces Mailchimp notification.
 */
export const onLeadCreatedAdminNotify = onDocumentCreated(
  {
    document: "leads/{leadId}",
    region: "asia-southeast1",
    secrets: [RESEND_API_KEY],
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const lead = snap.data();
    const leadId = event.params.leadId;

    const leadEmail = lead?.email || "Không có email";
    const leadName = lead?.name || "Không có tên";
    const leadPhone = lead?.phone || "Không có SĐT";
    const hollandCode = lead?.quizResult?.hollandCode || "Chưa có";
    const createdAt = new Date().toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
    });

    const subject = `🆕 Lead mới: ${leadName} (${leadEmail})`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0e0e1a; border-bottom: 2px solid #e8654a; padding-bottom: 10px;">
          📋 Lead Mới — Nghề Chọn Người
        </h2>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold; width: 140px;">Tên</td>
            <td style="padding: 8px 12px;">${leadName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold;">Email</td>
            <td style="padding: 8px 12px;">${leadEmail}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold;">Số điện thoại</td>
            <td style="padding: 8px 12px;">${leadPhone}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold;">Holland Code</td>
            <td style="padding: 8px 12px;">${hollandCode}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold;">Thời gian</td>
            <td style="padding: 8px 12px;">${createdAt}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; background: #f5f5f5; font-weight: bold;">Lead ID</td>
            <td style="padding: 8px 12px; font-size: 12px; color: #666;">${leadId}</td>
          </tr>
        </table>

        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          Email tự động từ hệ thống Nghề Chọn Người.
        </p>
      </div>
    `;

    try {
      await sendTemplateEmail({
        apiKey: RESEND_API_KEY.value(),
        to: ADMIN_EMAIL,
        subject,
        html,
      });
      logger.info(`Admin notification sent for lead ${leadId} (${leadEmail})`);
    } catch (err) {
      logger.error(`Failed to send admin notification for lead ${leadId}:`, err);
    }
  }
);
