/**
 * POST /api/admin/notify-quiz-fixed
 * 
 * Gửi email thông báo cho tất cả leads đăng ký HÔM NAY (sáng 13/09/2026)
 * mà chưa mua báo cáo (pdfPurchased = false).
 * 
 * Nội dung: "Lỗi hệ thống đã được khắc phục, vào lấy kết quả ngay."
 */
import { NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

function initFirebase() {
  if (!getApps().length && process.env.FIREBASE_SERVICE_ACCOUNT) {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
    initializeApp({ credential: cert(sa) });
  }
  return getFirestore();
}

async function sendResendEmail(params: {
  to: string;
  name: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY not set');

  const firstName = (params.name || 'bạn').split(' ').pop() || 'bạn';

  const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kết quả định hướng nghề nghiệp của bạn đã sẵn sàng</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1e3a5f 0%,#2d5a8e 100%);padding:40px 32px;text-align:center;">
      <div style="font-size:13px;font-weight:800;letter-spacing:3px;color:#E8A838;text-transform:uppercase;margin-bottom:12px;">NCN ACADEMY</div>
      <h1 style="color:#ffffff;font-size:26px;font-weight:900;margin:0;line-height:1.3;">
        ✅ Hệ thống đã khắc phục<br>Kết quả của bạn đã sẵn sàng!
      </h1>
    </div>

    <!-- Body -->
    <div style="padding:36px 32px;">
      <p style="font-size:16px;color:#374151;margin:0 0 16px;line-height:1.7;">
        Xin chào <strong>${firstName}</strong>,
      </p>
      <p style="font-size:15px;color:#374151;margin:0 0 16px;line-height:1.7;">
        Sáng nay hệ thống phân tích nghề nghiệp của chúng tôi gặp một sự cố kỹ thuật nhỏ khiến 
        một số bạn <strong>không thể xem kết quả</strong> sau khi hoàn thành bài test.
      </p>
      <p style="font-size:15px;color:#374151;margin:0 0 24px;line-height:1.7;">
        <strong>Chúng tôi đã khắc phục hoàn toàn.</strong> Bạn chỉ cần vào lại và làm lại bài test 
        ngắn (5 phút) để xem <strong>TOP 5 nghề phù hợp nhất</strong> với tính cách và thế mạnh của bạn.
      </p>

      <!-- CTA Button -->
      <div style="text-align:center;margin:32px 0;">
        <a href="https://quiz.nghechonnguoi.com"
           style="display:inline-block;background:linear-gradient(135deg,#E8A838,#f0c060);color:#1B2A4A;
                  font-size:17px;font-weight:900;padding:16px 40px;border-radius:12px;
                  text-decoration:none;box-shadow:0 4px 16px rgba(232,168,56,0.4);">
          🎯 Xem Kết Quả Định Hướng Nghề Nghiệp →
        </a>
      </div>

      <!-- Info box -->
      <div style="background:#f0f9ff;border-left:4px solid #0ea5e9;border-radius:8px;padding:16px 20px;margin:0 0 24px;">
        <p style="margin:0;font-size:14px;color:#0369a1;line-height:1.6;">
          <strong>📝 Lưu ý:</strong> Do lỗi kỹ thuật sáng nay, hệ thống đã tự động xóa kết quả cũ 
          để đảm bảo độ chính xác. Bài test chỉ mất <strong>5 phút</strong> để hoàn thành lại.
        </p>
      </div>

      <p style="font-size:14px;color:#6b7280;margin:0;line-height:1.6;">
        Nếu bạn cần hỗ trợ, liên hệ chúng tôi qua 
        <a href="https://zalo.me/0986864591" style="color:#0ea5e9;">Zalo: 0986.864.591</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">
        © 2026 NCN Academy · Hệ thống Định hướng Nghề nghiệp
        <br>
        <a href="https://nghechonnguoi.com/email/unsubscribe?email=${encodeURIComponent(params.to)}" 
           style="color:#9ca3af;">Hủy đăng ký nhận email</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Nghề Chọn Người <no-reply@nghechonnguoi.com>',
      to: [params.to],
      subject: '✅ Hệ thống đã sửa — Vào xem kết quả định hướng nghề nghiệp của bạn ngay',
      html,
      reply_to: 'tuvanhuongnghiepchonnghe@gmail.com',
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Resend error ${response.status}: ${err}`);
  }

  return response.json();
}

export async function POST(req: Request) {
  try {
    // Simple auth check bằng header
    const authHeader = req.headers.get('x-admin-key');
    if (authHeader !== (process.env.ADMIN_SECRET_KEY || 'ncnadmin2026')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = initFirebase();

    // Tìm leads đăng ký HÔM NAY (từ 00:00 giờ Việt Nam = 17:00 UTC hôm qua)
    const todayStart = new Date('2026-09-13T00:00:00+07:00'); // 17:00 UTC 12/09
    const todayStartTs = Timestamp.fromDate(todayStart);

    console.log(`Querying leads created after: ${todayStart.toISOString()}`);

    // Chỉ query theo createdAt (single-field index) để tránh cần composite index
    // Lọc pdfPurchased trong JavaScript
    const leadsSnap = await db.collection('leads')
      .where('createdAt', '>=', todayStartTs)
      .orderBy('createdAt', 'desc')
      .limit(500)
      .get();

    if (leadsSnap.empty) {
      return NextResponse.json({ 
        success: true, 
        sent: 0, 
        message: 'Không có lead nào đăng ký hôm nay' 
      });
    }

    // Lọc chưa mua PDF trong JS
    const allLeads = leadsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
    const leads = allLeads.filter(l => !l.purchases?.pdfPurchased);
    console.log(`Found ${leads.length} leads to notify`);

    const results: { email: string; status: 'sent' | 'skipped' | 'error'; reason?: string }[] = [];

    for (const lead of leads) {
      const email: string = lead.email;
      
      // Skip nếu đã unsubscribe
      if (lead.emailSequence?.unsubscribed === true) {
        results.push({ email, status: 'skipped', reason: 'unsubscribed' });
        continue;
      }

      if (!email || !email.includes('@')) {
        results.push({ email: email || 'N/A', status: 'skipped', reason: 'invalid email' });
        continue;
      }

      try {
        await sendResendEmail({ to: email, name: lead.name || '' });
        results.push({ email, status: 'sent' });

        // Thêm delay nhỏ để tránh rate limit Resend
        await new Promise(r => setTimeout(r, 150));
      } catch (err: any) {
        console.error(`Failed to send to ${email}:`, err.message);
        results.push({ email, status: 'error', reason: err.message });
      }
    }

    const sentCount = results.filter(r => r.status === 'sent').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const skippedCount = results.filter(r => r.status === 'skipped').length;

    return NextResponse.json({
      success: true,
      total: leads.length,
      sent: sentCount,
      skipped: skippedCount,
      errors: errorCount,
      details: results,
    });

  } catch (err: any) {
    console.error('notify-quiz-fixed error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST with x-admin-key header' });
}
