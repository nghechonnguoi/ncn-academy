/**
 * POST /api/admin/send-report
 *
 * Đọc dữ liệu từ Firestore và gửi email báo cáo qua Resend.
 * Được gọi bởi:
 *   - Vercel Cron Job (tự động)
 *   - Admin nhấn nút "Gửi báo cáo ngay" (thủ công)
 *
 * ENV cần có:
 *   RESEND_API_KEY        — key từ resend.com
 *   REPORT_EMAIL_TO       — email nhận báo cáo (VD: admin@nghechonnguoi.com)
 *   REPORT_EMAIL_FROM     — email gửi đi, phải verify trên Resend (VD: report@nghechonnguoi.com)
 *   CRON_SECRET           — secret để bảo vệ endpoint khi gọi từ cron
 *   FIREBASE_SERVICE_ACCOUNT — JSON key của Firebase Admin
 */

import { NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// ── Firebase init ──────────────────────────────────────────────────────────────
function getDb() {
  if (!getApps().length) {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
    initializeApp({ credential: cert(sa) });
  }
  return getFirestore();
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtVND(amount: number) {
  return amount.toLocaleString('vi-VN') + 'đ';
}

function fmtDate(ts: any): string {
  if (!ts) return '—';
  const d: Date = ts?.toDate?.() ?? new Date(ts);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── Lấy dữ liệu ───────────────────────────────────────────────────────────────
async function fetchReportData(db: FirebaseFirestore.Firestore, periodDays: number) {
  const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
  const sinceTs = Timestamp.fromDate(since);

  // 1. Đơn hàng đã thanh toán trong kỳ
  const ordersSnap = await db.collection('orders')
    .where('status', '==', 'PAID')
    .where('createdAt', '>=', sinceTs)
    .orderBy('createdAt', 'desc')
    .get();

  const orders = ordersSnap.docs.map(d => {
    const data = d.data();
    return {
      orderCode:  d.id,
      email:      data.email ?? '—',
      amount:     data.amount ?? data.finalAmount ?? 0,
      couponCode: data.couponCode ?? null,
      createdAt:  fmtDate(data.createdAt),
    };
  });

  const totalRevenue = orders.reduce((s, o) => s + o.amount, 0);

  // 2. Tất cả affiliate đã đăng ký (không giới hạn kỳ)
  const affSnap = await db.collection('affiliates').get();
  const affiliates = affSnap.docs.map(d => {
    const data = d.data();
    return {
      name:         data.name ?? '—',
      phone:        data.phone ?? '—',
      referralCode: data.referralCode ?? d.id,
      lifetimeOrders: data.lifetimeOrders ?? 0,
      createdAt:    fmtDate(data.createdAt),
    };
  });

  // 3. Mã coupon đã dùng
  const usedSnap = await db.collection('used_coupons').get();
  const usedCoupons = usedSnap.docs.map(d => {
    const data = d.data();
    return {
      code:      d.id,
      orderCode: data.orderCode ?? '—',
      usedAt:    fmtDate(data.usedAt),
    };
  });

  return { orders, totalRevenue, affiliates, usedCoupons, since };
}

// ── HTML Email Template ────────────────────────────────────────────────────────
function buildEmailHtml(data: Awaited<ReturnType<typeof fetchReportData>>, periodDays: number) {
  const { orders, totalRevenue, affiliates, usedCoupons, since } = data;

  const ordersRows = orders.length > 0
    ? orders.map(o => `
        <tr style="border-bottom:1px solid #f1f5f9">
          <td style="padding:10px 12px;font-family:monospace;font-size:12px;color:#6366f1">#${o.orderCode}</td>
          <td style="padding:10px 12px;font-size:13px">${o.email}</td>
          <td style="padding:10px 12px;font-size:13px;font-weight:700;color:#16a34a">${fmtVND(o.amount)}</td>
          <td style="padding:10px 12px;font-size:12px;color:#94a3b8">${o.couponCode ?? '—'}</td>
          <td style="padding:10px 12px;font-size:12px;color:#94a3b8">${o.createdAt}</td>
        </tr>`).join('')
    : '<tr><td colspan="5" style="padding:24px;text-align:center;color:#94a3b8;font-size:13px">Không có đơn hàng nào trong kỳ này</td></tr>';

  const affRows = affiliates.length > 0
    ? affiliates.slice(0, 30).map(a => `
        <tr style="border-bottom:1px solid #f1f5f9">
          <td style="padding:8px 12px;font-size:13px">${a.name}</td>
          <td style="padding:8px 12px;font-size:12px;color:#64748b">${a.phone}</td>
          <td style="padding:8px 12px;font-family:monospace;font-size:12px;color:#6366f1">${a.referralCode}</td>
          <td style="padding:8px 12px;font-size:13px;font-weight:700;color:#6366f1">${a.lifetimeOrders}</td>
          <td style="padding:8px 12px;font-size:12px;color:#94a3b8">${a.createdAt}</td>
        </tr>`).join('')
    : '<tr><td colspan="5" style="padding:24px;text-align:center;color:#94a3b8;font-size:13px">Chưa có affiliate nào</td></tr>';

  const now = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const periodLabel = periodDays === 1 ? 'hôm nay' : `${periodDays} ngày qua`;

  return `
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:700px;margin:0 auto;padding:24px">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1B2A4A 0%,#243049 100%);border-radius:16px;padding:32px;margin-bottom:20px;text-align:center">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:3px;color:rgba(255,255,255,0.5)">NCN ACADEMY</p>
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:900;color:#fff">📊 Báo cáo hệ thống</h1>
      <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.6)">Kỳ: <strong style="color:#E8A838">${periodLabel}</strong> · Xuất lúc ${now}</p>
    </div>

    <!-- Stats cards -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px">
      <div style="background:#fff;border-radius:12px;padding:20px;border:1px solid #e2e8f0;text-align:center">
        <div style="font-size:28px;font-weight:900;color:#16a34a">${orders.length}</div>
        <div style="font-size:11px;color:#64748b;margin-top:2px">📦 Đơn hàng</div>
      </div>
      <div style="background:#fff;border-radius:12px;padding:20px;border:1px solid #e2e8f0;text-align:center">
        <div style="font-size:22px;font-weight:900;color:#E8A838">${fmtVND(totalRevenue)}</div>
        <div style="font-size:11px;color:#64748b;margin-top:2px">💰 Doanh thu</div>
      </div>
      <div style="background:#fff;border-radius:12px;padding:20px;border:1px solid #e2e8f0;text-align:center">
        <div style="font-size:28px;font-weight:900;color:#6366f1">${affiliates.length}</div>
        <div style="font-size:11px;color:#64748b;margin-top:2px">🤝 Tổng Affiliate</div>
      </div>
    </div>

    <!-- Orders table -->
    <div style="background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;margin-bottom:20px">
      <div style="padding:16px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:8px">
        <span style="font-size:14px;font-weight:700;color:#1e293b">📦 Đơn hàng đã thanh toán (${periodLabel})</span>
        <span style="margin-left:auto;background:#dcfce7;color:#16a34a;font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px">${orders.length} đơn</span>
      </div>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f8fafc">
            <th style="text-align:left;padding:10px 12px;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase">Mã đơn</th>
            <th style="text-align:left;padding:10px 12px;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase">Email</th>
            <th style="text-align:left;padding:10px 12px;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase">Số tiền</th>
            <th style="text-align:left;padding:10px 12px;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase">Mã ưu đãi</th>
            <th style="text-align:left;padding:10px 12px;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase">Thời gian</th>
          </tr>
        </thead>
        <tbody>${ordersRows}</tbody>
      </table>
    </div>

    <!-- Affiliates table -->
    <div style="background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;margin-bottom:20px">
      <div style="padding:16px 20px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:8px">
        <span style="font-size:14px;font-weight:700;color:#1e293b">🤝 Danh sách Affiliate</span>
        <span style="margin-left:auto;background:#ede9fe;color:#6366f1;font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px">${affiliates.length} người</span>
      </div>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f8fafc">
            <th style="text-align:left;padding:10px 12px;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase">Tên</th>
            <th style="text-align:left;padding:10px 12px;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase">Điện thoại</th>
            <th style="text-align:left;padding:10px 12px;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase">Mã giới thiệu</th>
            <th style="text-align:left;padding:10px 12px;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase">Tổng đơn</th>
            <th style="text-align:left;padding:10px 12px;font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase">Đăng ký</th>
          </tr>
        </thead>
        <tbody>${affRows}</tbody>
      </table>
      ${affiliates.length > 30 ? `<div style="padding:12px;text-align:center;font-size:12px;color:#94a3b8">... và ${affiliates.length - 30} người khác</div>` : ''}
    </div>

    <!-- Coupon stats -->
    <div style="background:#fff;border-radius:12px;border:1px solid #e2e8f0;padding:20px;margin-bottom:20px">
      <div style="font-size:14px;font-weight:700;color:#1e293b;margin-bottom:12px">🎟️ Thống kê mã ưu đãi</div>
      <div style="display:flex;gap:16px">
        <div style="background:#f1f5f9;border-radius:8px;padding:12px 20px;text-align:center;flex:1">
          <div style="font-size:22px;font-weight:900;color:#1e293b">${usedCoupons.length}</div>
          <div style="font-size:11px;color:#64748b;margin-top:2px">Mã đã dùng (tổng)</div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:20px 0">
      <p style="margin:0;font-size:12px;color:#94a3b8">© NCN Academy · Báo cáo tự động · <a href="https://nghechonnguoi.com/admin" style="color:#6366f1">Vào Admin Panel</a></p>
    </div>
  </div>
</body>
</html>`;
}

// ── Handler ────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    // Xác thực: cron secret hoặc admin header
    const authHeader = req.headers.get('authorization') ?? '';
    const cronSecret = process.env.CRON_SECRET ?? 'ncn-cron-secret-2026';
    const isValidCron = authHeader === `Bearer ${cronSecret}`;

    // Cho phép gọi từ admin panel (internal) không cần auth nếu chạy local
    const host = req.headers.get('host') ?? '';
    const isInternal = host.includes('localhost');

    if (!isValidCron && !isInternal) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const periodDays: number = Number(body.periodDays ?? 1); // 1 = hàng ngày, 7 = hàng tuần

    const resendKey = process.env.RESEND_API_KEY;
    const emailTo   = process.env.REPORT_EMAIL_TO;
    const emailFrom = process.env.REPORT_EMAIL_FROM ?? 'onboarding@resend.dev';

    if (!resendKey || !emailTo) {
      return NextResponse.json({
        error: 'Thiếu RESEND_API_KEY hoặc REPORT_EMAIL_TO trong environment variables',
        hint: 'Thêm vào Vercel Settings → Environment Variables',
      }, { status: 500 });
    }

    const db = getDb();
    const reportData = await fetchReportData(db, periodDays);
    const html = buildEmailHtml(reportData, periodDays);

    const resend = new Resend(resendKey);
    const periodLabel = periodDays === 1 ? 'hôm nay' : `${periodDays} ngày qua`;

    const { data, error } = await resend.emails.send({
      from: `NCN Academy <${emailFrom}>`,
      to:   [emailTo],
      subject: `📊 Báo cáo NCN Academy — ${reportData.orders.length} đơn hàng ${periodLabel} · ${(reportData.totalRevenue / 1000000).toFixed(1)}M đ`,
      html,
    });

    if (error) {
      console.error('[send-report] Resend error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[send-report] Email sent:', data?.id);
    return NextResponse.json({
      success: true,
      emailId: data?.id,
      summary: {
        orders:     reportData.orders.length,
        revenue:    reportData.totalRevenue,
        affiliates: reportData.affiliates.length,
        sentTo:     emailTo,
        periodDays,
      },
    });

  } catch (err: any) {
    console.error('[send-report] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Vercel Cron gọi bằng GET
export async function GET(req: Request) {
  return POST(req);
}
