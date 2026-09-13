export default function AffiliateStatsPage() {
  return (
    <html lang="vi">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Thành Tích Affiliate — NCN Academy</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Inter', sans-serif; background: #0b1120; color: #e2e8f0; min-height: 100vh; }
          .header { background: linear-gradient(135deg, #1e3a5f 0%, #0b1120 100%); border-bottom: 1px solid rgba(255,255,255,0.06); padding: 20px 24px; display: flex; align-items: center; gap: 12px; }
          .logo { font-size: 13px; font-weight: 900; letter-spacing: 3px; color: #E8A838; text-transform: uppercase; }
          .header-title { font-size: 14px; color: rgba(255,255,255,0.5); }
          #login-screen { display: flex; align-items: center; justify-content: center; min-height: calc(100vh - 65px); padding: 24px; }
          .login-card { background: #1e293b; border: 1px solid rgba(255,255,255,0.07); border-radius: 20px; padding: 40px 32px; width: 100%; max-width: 380px; text-align: center; }
          .login-card .icon { font-size: 48px; margin-bottom: 16px; }
          .login-card h2 { font-size: 22px; font-weight: 800; color: #fff; margin-bottom: 6px; }
          .login-card p { font-size: 14px; color: rgba(255,255,255,0.5); margin-bottom: 24px; line-height: 1.6; }
          .input-group { position: relative; margin-bottom: 12px; }
          .input-group input { width: 100%; padding: 14px 16px; background: #0f172a; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; color: #fff; font-size: 18px; font-weight: 700; letter-spacing: 3px; text-align: center; outline: none; text-transform: uppercase; font-family: 'Inter', monospace; transition: border-color 0.2s; }
          .input-group input:focus { border-color: #E8A838; }
          .input-group input::placeholder { letter-spacing: 1px; font-weight: 400; font-size: 14px; }
          .btn-primary { width: 100%; padding: 16px; background: linear-gradient(135deg, #E8A838, #f0c060); border: none; border-radius: 12px; color: #1B2A4A; font-size: 16px; font-weight: 800; cursor: pointer; transition: opacity 0.2s; }
          .btn-primary:hover { opacity: 0.9; }
          .error-msg { color: #f87171; font-size: 13px; margin-top: 10px; min-height: 20px; }
          #dashboard { display: none; }
          .container { max-width: 800px; margin: 0 auto; padding: 24px 16px 60px; }
          .aff-header { background: linear-gradient(135deg, #1e3a5f, #243b55); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 24px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
          .aff-name { font-size: 22px; font-weight: 900; color: #fff; }
          .aff-code { font-size: 13px; color: rgba(255,255,255,0.4); margin-top: 2px; }
          .tier-badge { padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 800; }
          .tier-Thanh-vien { background: #475569; color: #fff; }
          .tier-Bac { background: #94a3b8; color: #1e293b; }
          .tier-Vang { background: linear-gradient(135deg, #f59e0b, #fbbf24); color: #1e293b; }
          .tier-Kim-Cuong { background: linear-gradient(135deg, #38bdf8, #7dd3fc); color: #1e293b; }
          .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px; }
          @media (min-width: 600px) { .stats-grid { grid-template-columns: repeat(4, 1fr); } }
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
          .progress-bar-fill { height: 100%; border-radius: 100px; background: linear-gradient(90deg, #E8A838, #f0c060); transition: width 0.8s ease; }
          .tier-labels { display: flex; justify-content: space-between; font-size: 12px; color: rgba(255,255,255,0.4); }
          .link-section { background: #1e293b; border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; padding: 20px; margin-bottom: 20px; }
          .link-section h3 { font-size: 14px; font-weight: 700; color: rgba(255,255,255,0.6); margin-bottom: 12px; }
          .link-box { display: flex; gap: 8px; align-items: center; }
          .link-url { flex: 1; background: #0f172a; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 10px 14px; font-size: 13px; color: #2BA88C; font-family: monospace; word-break: break-all; }
          .btn-copy { background: rgba(255,255,255,0.08); border: none; border-radius: 10px; color: #fff; padding: 10px 14px; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: background 0.2s; }
          .btn-copy:hover { background: rgba(255,255,255,0.14); }
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
          .loading { text-align: center; padding: 60px 24px; color: rgba(255,255,255,0.4); }
          .spin { display: inline-block; width: 28px; height: 28px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #E8A838; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 12px; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </head>
      <body>
        <div className="header">
          <div>
            <div className="logo">NCN Academy</div>
            <div className="header-title">Thành tích Affiliate</div>
          </div>
        </div>

        <div id="login-screen">
          <div className="login-card">
            <div className="icon">🏆</div>
            <h2>Xem thành tích của bạn</h2>
            <p>Nhập mã affiliate của bạn để xem thống kê đơn hàng và hoa hồng</p>
            <div className="input-group">
              <input type="text" id="code-input" placeholder="VD: KHANH783" maxLength={20} />
            </div>
            <button className="btn-primary" id="login-btn">Xem thành tích →</button>
            <div className="error-msg" id="login-error"></div>
          </div>
        </div>

        <div id="dashboard">
          <div className="container" id="dashboard-content">
            <div className="loading">
              <div className="spin"></div><br />Đang tải dữ liệu...
            </div>
          </div>
        </div>

        <script dangerouslySetInnerHTML={{ __html: `
          const API = 'https://ncn-academy-web.vercel.app/api/affiliate-stats';

          window.addEventListener('load', function() {
            var saved = localStorage.getItem('ncn_aff_code');
            if (saved) { document.getElementById('code-input').value = saved; doLogin(); }
            document.getElementById('code-input').addEventListener('input', function() { this.value = this.value.toUpperCase(); });
            document.getElementById('code-input').addEventListener('keypress', function(e) { if (e.key === 'Enter') doLogin(); });
            document.getElementById('login-btn').addEventListener('click', doLogin);
          });

          async function doLogin() {
            var code = document.getElementById('code-input').value.trim().toUpperCase();
            var errEl = document.getElementById('login-error');
            errEl.textContent = '';
            if (!code) { errEl.textContent = 'Vui lòng nhập mã affiliate'; return; }
            try {
              var res = await fetch(API + '?code=' + encodeURIComponent(code));
              var data = await res.json();
              if (!data.success) { errEl.textContent = data.error || 'Mã không hợp lệ'; localStorage.removeItem('ncn_aff_code'); return; }
              localStorage.setItem('ncn_aff_code', code);
              showDashboard(data);
            } catch(err) { errEl.textContent = 'Lỗi kết nối, vui lòng thử lại'; }
          }

          function fmt(n) { return (n||0).toLocaleString('vi-VN') + 'đ'; }

          function showDashboard(data) {
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            var aff = data.affiliate, stats = data.stats, recentOrders = data.recentOrders;
            var tierNames = ['Thành viên','Bạc','Vàng','Kim Cương'];
            var tierThresholds = [0, 10, 30, 80];
            var tierIdx = tierNames.indexOf(stats.tier);
            var currentMin = tierThresholds[tierIdx] || 0;
            var nextMin = tierThresholds[tierIdx+1] || currentMin+1;
            var progressPct = tierIdx === 3 ? 100 : Math.min(100, Math.round(((stats.lifetimeOrders - currentMin) / (nextMin - currentMin)) * 100));
            var tierClass = 'tier-' + stats.tier.replace(/\\s+/g,'-').replace(/À-Ỹà-ỹ/g,'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace('Thành viên','Thanh-vien').replace('Bạc','Bac').replace('Vàng','Vang').replace('Kim Cương','Kim-Cuong');
            var nextTierHtml = stats.nextTier
              ? '<div class="tier-labels"><span>' + stats.tier + '</span><span>' + stats.nextTier.name + ' — còn ' + stats.nextTier.ordersNeeded + ' đơn nữa</span></div>'
              : '<div class="tier-labels"><span>🏆 Đã đạt bậc cao nhất!</span></div>';
            var ordersHtml = recentOrders.length === 0
              ? '<div class="empty-orders">Chưa có đơn hàng nào</div>'
              : recentOrders.map(function(o) { return '<div class="order-row"><div><div class="order-name">' + o.customerName + '</div><div class="order-date">' + o.date + ' · #' + o.orderCode + '</div></div><div class="order-amount">' + fmt(o.amount) + '</div></div>'; }).join('');
            document.getElementById('dashboard-content').innerHTML =
              '<div class="aff-header"><div><div class="aff-name">' + aff.name + '</div><div class="aff-code">Mã: ' + aff.referralCode + ' · ' + (stats.commissionRate*100).toFixed(0) + '% hoa hồng</div></div><span class="tier-badge ' + tierClass + '">' + stats.tier + '</span></div>' +
              '<div class="stats-grid"><div class="stat-card"><div class="stat-label">Đơn lifetime</div><div class="stat-value">' + stats.lifetimeOrders + '</div><div class="stat-sub">tổng đơn thành công</div></div><div class="stat-card"><div class="stat-label">Doanh thu lifetime</div><div class="stat-value yellow" style="font-size:18px;">' + fmt(stats.lifetimeRevenue) + '</div><div class="stat-sub">tổng giá trị</div></div><div class="stat-card"><div class="stat-label">Đơn tháng này</div><div class="stat-value">' + stats.thisMonth.orders + '</div><div class="stat-sub">tháng hiện tại</div></div><div class="stat-card"><div class="stat-label">Hoa hồng tháng này</div><div class="stat-value green" style="font-size:18px;">' + fmt(stats.thisMonth.commission) + '</div><div class="stat-sub">chờ thanh toán</div></div></div>' +
              '<div class="months-grid"><div class="month-card current"><div class="month-label">📅 Tháng này</div><div class="month-commission">' + fmt(stats.thisMonth.commission) + '</div><div class="month-detail">' + stats.thisMonth.orders + ' đơn · ' + fmt(stats.thisMonth.revenue) + ' doanh thu</div></div><div class="month-card"><div class="month-label">Tháng trước</div><div class="month-commission" style="color:#94a3b8;">' + fmt(stats.lastMonth.commission) + '</div><div class="month-detail">' + stats.lastMonth.orders + ' đơn · ' + fmt(stats.lastMonth.revenue) + ' doanh thu</div></div></div>' +
              '<div class="tier-progress"><h3>🎯 Tiến độ thăng bậc</h3><div class="progress-bar-bg"><div class="progress-bar-fill" style="width:' + progressPct + '%"></div></div>' + nextTierHtml + '<div style="margin-top:12px;font-size:12px;color:rgba(255,255,255,0.35);">Thành viên (0đ) → Bạc 22% (10đ) → Vàng 25% (30đ) → Kim Cương 30% (80đ)</div></div>' +
              '<div class="link-section"><h3>🔗 Link giới thiệu của bạn</h3><div class="link-box"><div class="link-url">' + aff.affiliateLink + '</div><button class="btn-copy" id="copy-btn" onclick="copyLink(\\'' + aff.affiliateLink + '\\')">📋 Copy</button></div></div>' +
              '<div class="recent-section"><h3>🕐 ' + recentOrders.length + ' đơn gần nhất</h3>' + ordersHtml + '</div>' +
              '<div class="logout-btn" onclick="logout()">← Đăng xuất / Đổi mã</div>';
          }

          function copyLink(link) {
            navigator.clipboard.writeText(link).then(function() {
              var btn = document.getElementById('copy-btn');
              btn.textContent = '✅ Đã copy!'; btn.classList.add('copied');
              setTimeout(function() { btn.textContent = '📋 Copy'; btn.classList.remove('copied'); }, 2000);
            });
          }

          function logout() {
            localStorage.removeItem('ncn_aff_code');
            document.getElementById('login-screen').style.display = 'flex';
            document.getElementById('dashboard').style.display = 'none';
            document.getElementById('code-input').value = '';
            document.getElementById('login-error').textContent = '';
          }
        `}} />
      </body>
    </html>
  );
}
