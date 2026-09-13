'use client';

import { useEffect } from 'react';

export default function AffiliateStatsPage() {
  useEffect(() => {
    const API = 'https://ncn-academy-web.vercel.app/api/affiliate-stats';

    const saved = localStorage.getItem('ncn_aff_code');
    if (saved) {
      const input = document.getElementById('code-input') as HTMLInputElement;
      if (input) input.value = saved;
      doLogin();
    }

    const input = document.getElementById('code-input');
    input?.addEventListener('input', (e: any) => { e.target.value = e.target.value.toUpperCase(); });
    input?.addEventListener('keypress', (e: any) => { if (e.key === 'Enter') doLogin(); });
    document.getElementById('login-btn')?.addEventListener('click', doLogin);

    async function doLogin() {
      const code = ((document.getElementById('code-input') as HTMLInputElement)?.value || '').trim().toUpperCase();
      const errEl = document.getElementById('login-error')!;
      errEl.textContent = '';
      if (!code) { errEl.textContent = 'Vui lòng nhập mã affiliate'; return; }
      try {
        const res = await fetch(`${API}?code=${encodeURIComponent(code)}`);
        const data = await res.json();
        if (!data.success) { errEl.textContent = data.error || 'Mã không hợp lệ'; localStorage.removeItem('ncn_aff_code'); return; }
        localStorage.setItem('ncn_aff_code', code);
        showDashboard(data);
      } catch { errEl.textContent = 'Lỗi kết nối, vui lòng thử lại'; }
    }

    function fmt(n: number) { return (n || 0).toLocaleString('vi-VN') + 'đ'; }

    function showDashboard(data: any) {
      document.getElementById('login-screen')!.style.display = 'none';
      document.getElementById('dashboard')!.style.display = 'block';
      const { affiliate, stats, recentOrders } = data;
      const tierNames = ['Thành viên', 'Bạc', 'Vàng', 'Kim Cương'];
      const tierThresholds = [0, 10, 30, 80];
      const tierIdx = tierNames.indexOf(stats.tier);
      const currentMin = tierThresholds[tierIdx] || 0;
      const nextMin = tierThresholds[tierIdx + 1] || currentMin + 1;
      const progressPct = tierIdx === 3 ? 100 : Math.min(100, Math.round(((stats.lifetimeOrders - currentMin) / (nextMin - currentMin)) * 100));
      const tierMap: Record<string, string> = { 'Thành viên': 'thanh-vien', 'Bạc': 'bac', 'Vàng': 'vang', 'Kim Cương': 'kim-cuong' };
      const tierClass = 'tier-' + (tierMap[stats.tier] || 'thanh-vien');
      const nextTierHtml = stats.nextTier
        ? `<div class="tier-labels"><span>${stats.tier}</span><span>${stats.nextTier.name} — còn ${stats.nextTier.ordersNeeded} đơn nữa</span></div>`
        : `<div class="tier-labels"><span>🏆 Đã đạt bậc cao nhất!</span></div>`;
      const ordersHtml = recentOrders.length === 0
        ? '<div class="empty-orders">Chưa có đơn hàng nào</div>'
        : recentOrders.map((o: any) => `<div class="order-row"><div><div class="order-name">${o.customerName}</div><div class="order-date">${o.date} · #${o.orderCode}</div></div><div class="order-amount">${fmt(o.amount)}</div></div>`).join('');

      document.getElementById('dashboard-content')!.innerHTML = `
        <div class="aff-header">
          <div>
            <div class="aff-name">${affiliate.name}</div>
            <div class="aff-code">Mã: ${affiliate.referralCode} · ${(stats.commissionRate * 100).toFixed(0)}% hoa hồng</div>
          </div>
          <span class="tier-badge ${tierClass}">${stats.tier}</span>
        </div>
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-label">Đơn lifetime</div><div class="stat-value">${stats.lifetimeOrders}</div><div class="stat-sub">tổng đơn thành công</div></div>
          <div class="stat-card"><div class="stat-label">Doanh thu lifetime</div><div class="stat-value yellow" style="font-size:18px">${fmt(stats.lifetimeRevenue)}</div><div class="stat-sub">tổng giá trị</div></div>
          <div class="stat-card"><div class="stat-label">Đơn tháng này</div><div class="stat-value">${stats.thisMonth.orders}</div><div class="stat-sub">tháng hiện tại</div></div>
          <div class="stat-card"><div class="stat-label">Hoa hồng tháng này</div><div class="stat-value green" style="font-size:18px">${fmt(stats.thisMonth.commission)}</div><div class="stat-sub">chờ thanh toán</div></div>
        </div>
        <div class="months-grid">
          <div class="month-card current">
            <div class="month-label">📅 Tháng này</div>
            <div class="month-commission">${fmt(stats.thisMonth.commission)}</div>
            <div class="month-detail">${stats.thisMonth.orders} đơn · ${fmt(stats.thisMonth.revenue)} doanh thu</div>
          </div>
          <div class="month-card">
            <div class="month-label">Tháng trước</div>
            <div class="month-commission" style="color:#94a3b8">${fmt(stats.lastMonth.commission)}</div>
            <div class="month-detail">${stats.lastMonth.orders} đơn · ${fmt(stats.lastMonth.revenue)} doanh thu</div>
          </div>
        </div>
        <div class="tier-progress">
          <h3>🎯 Tiến độ thăng bậc</h3>
          <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${progressPct}%"></div></div>
          ${nextTierHtml}
          <div style="margin-top:12px;font-size:12px;color:rgba(255,255,255,0.35)">Thành viên (20%) → Bạc 22% (10đ) → Vàng 25% (30đ) → Kim Cương 30% (80đ)</div>
        </div>
        <div class="link-section">
          <h3>🔗 Link giới thiệu của bạn</h3>
          <div class="link-box">
            <div class="link-url">${affiliate.affiliateLink}</div>
            <button class="btn-copy" id="copy-btn">📋 Copy</button>
          </div>
        </div>
        <div class="recent-section">
          <h3>🕐 ${recentOrders.length} đơn gần nhất</h3>
          ${ordersHtml}
        </div>
        <div class="logout-btn" id="logout-btn">← Đăng xuất / Đổi mã</div>
      `;

      document.getElementById('copy-btn')?.addEventListener('click', () => {
        navigator.clipboard.writeText(affiliate.affiliateLink).then(() => {
          const btn = document.getElementById('copy-btn')!;
          btn.textContent = '✅ Đã copy!'; btn.classList.add('copied');
          setTimeout(() => { btn.textContent = '📋 Copy'; btn.classList.remove('copied'); }, 2000);
        });
      });
      document.getElementById('logout-btn')?.addEventListener('click', () => {
        localStorage.removeItem('ncn_aff_code');
        document.getElementById('login-screen')!.style.display = 'flex';
        document.getElementById('dashboard')!.style.display = 'none';
        (document.getElementById('code-input') as HTMLInputElement).value = '';
        document.getElementById('login-error')!.textContent = '';
      });
    }
  }, []);

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0b1120 !important; }
        .aff-page { font-family: 'Inter', 'Segoe UI', sans-serif; background: #0b1120; color: #e2e8f0; min-height: 100vh; }
        .aff-header-bar { background: linear-gradient(135deg,#1e3a5f,#0b1120); border-bottom: 1px solid rgba(255,255,255,0.06); padding: 20px 24px; }
        .logo { font-size: 13px; font-weight: 900; letter-spacing: 3px; color: #E8A838; text-transform: uppercase; }
        .header-title { font-size: 14px; color: rgba(255,255,255,0.5); }
        #login-screen { display: flex; align-items: center; justify-content: center; min-height: calc(100vh - 65px); padding: 24px; }
        .login-card { background: #1e293b; border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; padding: 40px 32px; width: 100%; max-width: 380px; text-align: center; }
        .login-card .icon { font-size: 48px; margin-bottom: 16px; }
        .login-card h2 { font-size: 22px; font-weight: 800; color: #fff; margin-bottom: 6px; }
        .login-card p { font-size: 14px; color: rgba(255,255,255,0.5); margin-bottom: 24px; line-height: 1.6; }
        #code-input { width: 100%; padding: 14px 16px; background: #0f172a; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: #fff; font-size: 18px; font-weight: 700; letter-spacing: 3px; text-align: center; outline: none; text-transform: uppercase; margin-bottom: 12px; transition: border-color 0.2s; }
        #code-input:focus { border-color: #E8A838; }
        #code-input::placeholder { letter-spacing: 1px; font-weight: 400; font-size: 14px; }
        #login-btn { width: 100%; padding: 16px; background: linear-gradient(135deg,#E8A838,#f0c060); border: none; border-radius: 12px; color: #1B2A4A; font-size: 16px; font-weight: 800; cursor: pointer; }
        #login-btn:hover { opacity: 0.9; }
        .error-msg { color: #f87171; font-size: 13px; margin-top: 10px; min-height: 20px; }
        #dashboard { display: none; }
        .container { max-width: 800px; margin: 0 auto; padding: 24px 16px 60px; }
        .aff-header { background: linear-gradient(135deg,#1e3a5f,#243b55); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 24px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
        .aff-name { font-size: 22px; font-weight: 900; color: #fff; }
        .aff-code { font-size: 13px; color: rgba(255,255,255,0.4); margin-top: 2px; }
        .tier-badge { padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 800; }
        .tier-thanh-vien { background: #475569; color: #fff; }
        .tier-bac { background: #94a3b8; color: #1e293b; }
        .tier-vang { background: linear-gradient(135deg,#f59e0b,#fbbf24); color: #1e293b; }
        .tier-kim-cuong { background: linear-gradient(135deg,#38bdf8,#7dd3fc); color: #1e293b; }
        .stats-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 12px; margin-bottom: 20px; }
        @media(min-width:600px){ .stats-grid { grid-template-columns: repeat(4,1fr); } }
        .stat-card { background: #1e293b; border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 18px 16px; text-align: center; }
        .stat-label { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
        .stat-value { font-size: 26px; font-weight: 900; color: #fff; line-height: 1; }
        .stat-value.green { color: #10b981; }
        .stat-value.yellow { color: #E8A838; }
        .stat-sub { font-size: 12px; color: rgba(255,255,255,0.35); margin-top: 4px; }
        .months-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
        .month-card { background: #1e293b; border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 20px; }
        .month-card.current { border-color: rgba(232,168,56,0.3); }
        .month-label { font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.4); text-transform: uppercase; margin-bottom: 12px; }
        .month-commission { font-size: 28px; font-weight: 900; color: #10b981; }
        .month-detail { font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 4px; }
        .tier-progress { background: #1e293b; border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 20px; margin-bottom: 20px; }
        .tier-progress h3 { font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.6); margin-bottom: 14px; }
        .progress-bar-bg { background: rgba(255,255,255,0.08); border-radius: 100px; height: 8px; margin: 8px 0 12px; overflow: hidden; }
        .progress-bar-fill { height: 100%; border-radius: 100px; background: linear-gradient(90deg,#E8A838,#f0c060); transition: width 0.8s ease; }
        .tier-labels { display: flex; justify-content: space-between; font-size: 12px; color: rgba(255,255,255,0.4); }
        .link-section { background: #1e293b; border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 20px; margin-bottom: 20px; }
        .link-section h3 { font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.6); margin-bottom: 12px; }
        .link-box { display: flex; gap: 8px; align-items: center; }
        .link-url { flex: 1; background: #0f172a; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 10px 14px; font-size: 13px; color: #2BA88C; font-family: monospace; word-break: break-all; }
        .btn-copy { background: rgba(255,255,255,0.08); border: none; border-radius: 10px; color: #fff; padding: 10px 14px; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; }
        .btn-copy.copied { background: rgba(43,168,140,0.2); color: #2BA88C; }
        .recent-section { background: #1e293b; border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; overflow: hidden; margin-bottom: 20px; }
        .recent-section h3 { font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.6); padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .order-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .order-row:last-child { border-bottom: none; }
        .order-name { font-size: 14px; font-weight: 600; color: #fff; }
        .order-date { font-size: 12px; color: rgba(255,255,255,0.3); margin-top: 2px; }
        .order-amount { font-size: 14px; font-weight: 700; color: #10b981; }
        .empty-orders { padding: 32px; text-align: center; color: rgba(255,255,255,0.3); font-size: 14px; }
        .logout-btn { display: block; text-align: center; padding: 12px; color: rgba(255,255,255,0.3); font-size: 13px; cursor: pointer; margin-top: 8px; }
        .logout-btn:hover { color: rgba(255,255,255,0.6); }
      `}</style>
      <div className="aff-page">
        <div className="aff-header-bar">
          <div className="logo">NCN Academy</div>
          <div className="header-title">Thành tích Affiliate</div>
        </div>

        <div id="login-screen">
          <div className="login-card">
            <div className="icon">🏆</div>
            <h2>Xem thành tích của bạn</h2>
            <p>Nhập mã affiliate của bạn để xem thống kê đơn hàng và hoa hồng</p>
            <input type="text" id="code-input" placeholder="VD: KHANH783" maxLength={20} />
            <button id="login-btn">Xem thành tích →</button>
            <div className="error-msg" id="login-error"></div>
          </div>
        </div>

        <div id="dashboard">
          <div className="container" id="dashboard-content" />
        </div>
      </div>
    </>
  );
}
