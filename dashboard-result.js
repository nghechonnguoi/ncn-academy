/**
 * dashboard-result.js — NCN Academy Result Redesign v1.0
 * Intercept report-container khi hiển thị, render lại 8 sections mới.
 * KHÔNG đụng vào script.js gốc.
 */
(function () {
  'use strict';

  const CAMPAIGN_START = new Date('2026-07-15T00:00:00+07:00');
  const CAMPAIGN_END   = new Date('2026-07-28T23:59:59+07:00');
  const now = new Date();
  const IS_CAMPAIGN = now >= CAMPAIGN_START && now <= CAMPAIGN_END;
  const PRICE = IS_CAMPAIGN ? 399000 : 799000;
  const PRICE_DISPLAY = IS_CAMPAIGN ? '399.000đ' : '799.000đ';
  const PRICE_ORIGINAL_DISPLAY = IS_CAMPAIGN ? '799.000đ' : '1.358.000đ';
  const BANK_BIN   = '970422';
  const BANK_ACCT  = '768688678';
  const BANK_OWNER = 'HO KINH DOANH NGHE CHON NGUOI';
  const API_BASE = 'https://nghechonnguoi.com/api';
  const COUNTDOWN_KEY = 'ncn_result_countdown';
  let countdownInterval = null;

  function startCountdown() {
    let startTs = localStorage.getItem(COUNTDOWN_KEY);
    if (!startTs) { startTs = String(Date.now()); localStorage.setItem(COUNTDOWN_KEY, startTs); }
    const endTs = parseInt(startTs) + 24 * 60 * 60 * 1000;
    function tick() {
      const remaining = Math.max(0, endTs - Date.now());
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      const el = document.getElementById('ncn-countdown');
      if (el) el.textContent = remaining === 0 ? 'ƯU ĐÃI ĐÃ HẾT HẠN' : `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
      if (remaining === 0) clearInterval(countdownInterval);
    }
    tick(); countdownInterval = setInterval(tick, 1000);
  }

  function calcMatchScore(p) {
    if (!p) return 78;
    const scores = [p.R_PCT, p.I_PCT, p.A_PCT, p.S_PCT, p.E_PCT, p.C_PCT].map(x => parseFloat(x || 0));
    const sorted = [...scores].sort((a,b) => b-a);
    const spread = (sorted[0] - sorted[sorted.length-1]) / 100;
    return Math.min(100, Math.round(spread * 50) + 40 + Math.min(20, 10 + parseInt(p.LIFEPATH || 0)));
  }

  function svgRing(score) {
    const r = 54, circ = 2 * Math.PI * r, offset = circ - (score / 100) * circ;
    const color = score >= 76 ? '#2BA88C' : score >= 50 ? '#E8A838' : '#ef4444';
    return `<div style="position:relative;width:144px;height:144px;margin:0 auto 16px;"><svg width="144" height="144" style="transform:rotate(-90deg);position:absolute;inset:0;"><circle cx="72" cy="72" r="${r}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="10"/><circle cx="72" cy="72" r="${r}" fill="none" stroke="${color}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${offset}" style="transition:stroke-dashoffset 1.2s ease"/></svg><div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;"><span style="font-size:32px;font-weight:900;color:#fff;line-height:1;">${score}</span><span style="font-size:11px;font-weight:700;color:${color};">/100</span></div></div>`;
  }

  async function fetchAiData(p) {
    try {
      const res = await fetch(`${API_BASE}/dashboard-ai`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ mbti: p.MBTI || 'ENFP', holland: p.HOLLAND || 'AIE', lifePath: p.LIFEPATH, assessmentId: null }) });
      return await res.json();
    } catch { return null; }
  }

  function openCheckout(payload) {
    const existing = document.getElementById('ncn-checkout-modal');
    if (existing) existing.remove();
    const modal = document.createElement('div');
    modal.id = 'ncn-checkout-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,0.85);backdrop-filter:blur(4px)';
    let finalAmount = PRICE;
    let orderCodeNum = parseInt((payload.MA_SO_HO_SO || '').replace(/[^0-9]/g, '').slice(-8)) || (Math.floor(Math.random() * 900000) + 100000);
    modal.innerHTML = `<div style="background:#1e293b;color:#fff;border-radius:20px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto;"><div style="display:flex;align-items:center;justify-content:space-between;padding:20px;border-bottom:1px solid rgba(255,255,255,0.1);position:sticky;top:0;background:#1e293b;z-index:1;"><div><p style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:#E8A838;margin:0 0 4px;">MỞ KHÓA BÁO CÁO ĐẦY ĐỦ</p><p style="font-size:15px;font-weight:900;color:#fff;margin:0;">Bản đồ sự nghiệp cá nhân hóa</p></div><button id="ncn-modal-close" style="background:rgba(255,255,255,0.08);border:none;color:#fff;border-radius:50%;width:32px;height:32px;font-size:18px;cursor:pointer;">✕</button></div><div id="ncn-modal-body" style="padding:20px;"><div style="background:rgba(255,255,255,0.06);border-radius:12px;padding:16px;margin-bottom:16px;"><p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin:0 0 12px;">📄 BÁO CÁO BAO GỒM</p>${['5 nghề phù hợp nhất — phân tích chi tiết','3 nghề nên tránh — và lý do cụ thể','Môi trường làm việc tối ưu','Lộ trình ngành học → nghề nghiệp → thu nhập','Chiến lược phát triển sự nghiệp 5 năm'].map(t=>`<div style="display:flex;gap:8px;margin-bottom:8px;"><span style="color:#2BA88C;">✓</span><span style="font-size:13px;color:rgba(255,255,255,0.8);">${t}</span></div>`).join('')}</div><div style="text-align:center;margin-bottom:16px;"><span style="text-decoration:line-through;color:rgba(255,255,255,0.4);font-size:14px;margin-right:10px;">1.358.000đ</span><span id="ncn-price-display" style="font-size:32px;font-weight:900;color:#E8A838;">799.000đ</span></div><div style="display:flex;gap:8px;margin-bottom:8px;"><input id="ncn-coupon" type="text" placeholder="Nhập mã ưu đãi (nếu có)" style="flex:1;padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:#0f172a;color:#fff;font-size:13px;outline:none;"><button id="ncn-coupon-btn" style="background:#3b82f6;color:#fff;border:none;padding:10px 16px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;">Áp dụng</button></div><p id="ncn-coupon-msg" style="font-size:12px;margin:0 0 12px;min-height:16px;"></p><p id="ncn-modal-error" style="color:#f87171;font-size:13px;background:rgba(248,113,113,0.1);border-radius:8px;padding:8px 12px;display:none;margin-bottom:12px;"></p><button id="ncn-pay-btn" style="width:100%;padding:18px;border-radius:14px;border:none;background:linear-gradient(135deg,#E8A838,#f0c060);color:#1B2A4A;font-size:16px;font-weight:900;cursor:pointer;">🔓 THANH TOÁN QUA MÃ QR</button><p style="text-align:center;font-size:11px;color:rgba(255,255,255,0.3);margin-top:10px;">Nhận file PDF trong 30 giây · Thanh toán bảo mật</p></div></div>`;
    document.body.appendChild(modal);
    document.getElementById('ncn-modal-close').onclick = () => modal.remove();
    modal.onclick = e => { if (e.target === modal) modal.remove(); };
    document.getElementById('ncn-coupon-btn').onclick = async () => {
      const code = (document.getElementById('ncn-coupon').value || '').trim().toUpperCase();
      const msgEl = document.getElementById('ncn-coupon-msg');
      if (!code) { msgEl.textContent = 'Vui lòng nhập mã'; msgEl.style.color = '#f87171'; return; }
      try {
        const res = await fetch(`${API_BASE}/apply-coupon`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ coupon: code, orderCode: String(orderCodeNum) }) });
        const d = await res.json();
        if (d.success) { finalAmount = 0; document.getElementById('ncn-price-display').textContent = 'MIỄN PHÍ'; document.getElementById('ncn-pay-btn').textContent = '🔓 NHẬN BÁO CÁO MIỄN PHÍ'; msgEl.textContent = '✅ Mã hợp lệ! Miễn phí 100%'; msgEl.style.color = '#34d399'; }
        else { msgEl.textContent = '❌ ' + (d.message || 'Mã không hợp lệ'); msgEl.style.color = '#f87171'; }
      } catch { msgEl.textContent = '❌ Lỗi kiểm tra mã'; msgEl.style.color = '#f87171'; }
    };
    document.getElementById('ncn-pay-btn').onclick = async () => {
      const btn = document.getElementById('ncn-pay-btn'); const errEl = document.getElementById('ncn-modal-error');
      btn.disabled = true; btn.textContent = '⏳ Đang xử lý...'; errEl.style.display = 'none';
      try {
        await fetch(`${API_BASE}/create-order`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ orderCode: orderCodeNum, orderId: `NCN-${orderCodeNum}`, amount: finalAmount, customerName: payload.HOTEN || '', customerEmail: payload.EMAIL || '', customerPhone: payload.DIEN_THOAI || '', payload }) });
        if (finalAmount === 0) {
          document.getElementById('ncn-modal-body').innerHTML = '<div style="text-align:center;padding:32px 16px;"><div style="font-size:48px;margin-bottom:16px;">⏳</div><p style="font-weight:800;font-size:18px;color:#fff;">Đang tạo báo cáo...</p></div>';
          const pdfRes = await fetch(`${API_BASE}/generate-pdf`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
          if (!pdfRes.ok) throw new Error('Lỗi tạo PDF');
          showDone(URL.createObjectURL(await pdfRes.blob()), payload.HOTEN || 'BaoCao'); return;
        }
        // Tao QR VietQR truc tiep - MB Bank, khong can PayOS
        const desc = `NCN ${orderCodeNum}`;
        const qrUrl = `https://img.vietqr.io/image/${BANK_BIN}-${BANK_ACCT}-compact2.png?amount=${finalAmount}&addInfo=${encodeURIComponent(desc)}&accountName=${encodeURIComponent(BANK_OWNER)}`;
        showQR(qrUrl, desc, finalAmount, orderCodeNum, payload);
      } catch (err) { btn.disabled = false; btn.textContent = '🔓 THANH TOÁN QUA MÃ QR'; errEl.textContent = err.message || 'Có lỗi, vui lòng thử lại'; errEl.style.display = 'block'; }
    };
  }

  function showQR(qrUrl, desc, amt, oc, payload) {
    const body = document.getElementById('ncn-modal-body'); if (!body) return;
    body.innerHTML = `<div style="text-align:center;"><p style="font-weight:800;font-size:18px;color:#fff;margin-bottom:4px;">Quét mã QR để thanh toán</p><p style="color:rgba(255,255,255,0.6);font-size:14px;margin-bottom:16px;">Số tiền: <strong style="color:#fff;">${Number(amt).toLocaleString('vi-VN')} VNĐ</strong></p><div style="display:inline-block;border:4px solid #fff;border-radius:12px;overflow:hidden;margin-bottom:16px;"><img src="${qrUrl}" alt="QR" style="width:220px;height:220px;display:block;"></div><div style="background:rgba(255,255,255,0.06);border-radius:10px;padding:12px;margin-bottom:16px;"><p style="color:#94a3b8;font-size:12px;margin:0 0 4px;">Nội dung chuyển khoản:</p><p style="font-weight:800;color:#fff;font-size:16px;margin:0;">${desc}</p></div><div style="display:flex;align-items:center;justify-content:center;gap:8px;color:#E8A838;font-weight:700;font-size:14px;"><div style="width:16px;height:16px;border:2px solid #E8A838;border-top-color:transparent;border-radius:50%;animation:ncnspin 1s linear infinite;"></div>Đang chờ thanh toán...</div></div><style>@keyframes ncnspin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style>`;
    const poll = setInterval(async () => {
      try {
        const r = await fetch(`${API_BASE}/order-status?orderCode=${oc}`); const d = await r.json();
        if (d.pdfDone && d.pdfBase64) { clearInterval(poll); const bytes = Uint8Array.from(atob(d.pdfBase64), c => c.charCodeAt(0)); showDone(URL.createObjectURL(new Blob([bytes], {type:'application/pdf'})), payload.HOTEN || 'BaoCao'); }
      } catch {}
    }, 3000);
  }

  function showDone(url, name) {
    const body = document.getElementById('ncn-modal-body'); if (!body) return;
    const safe = (name||'BaoCao').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9\s]/g,'').trim().replace(/\s+/g,'-');
    body.innerHTML = `<div style="text-align:center;padding:32px 0;"><div style="width:64px;height:64px;background:rgba(43,168,140,0.15);border:2px solid #2BA88C;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:32px;">✓</div><p style="font-weight:900;font-size:20px;color:#fff;margin-bottom:8px;">Báo cáo đã sẵn sàng! 🎉</p><p style="color:rgba(255,255,255,0.6);font-size:14px;margin-bottom:24px;">Báo cáo đã được gửi về email của bạn.</p>${url?`<a href="${url}" download="Bao-Cao-NCN-${safe}.pdf" style="display:inline-block;padding:16px 32px;border-radius:14px;background:linear-gradient(135deg,#2BA88C,#1e8a72);color:#fff;text-decoration:none;font-weight:900;font-size:16px;">📥 LƯU BÁO CÁO VỀ MÁY</a>`:''}</div>`;
  }

  function renderResultPage(payload) {
    const container = document.getElementById('report-container'); if (!container) return;
    const score = calcMatchScore(payload);
    const firstName = (payload.HOTEN || 'bạn').split(' ').pop();
    container.style.cssText = 'background:#f8fafc;padding:0;border:none;box-shadow:none;border-radius:0;max-width:none;margin:0;';
    container.innerHTML = `
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
#report-container *{box-sizing:border-box;font-family:'Inter',sans-serif;}
.ncn-section{padding:52px 20px;}
.ncn-cont{max-width:640px;margin:0 auto;}
.ncn-badge{display:inline-block;padding:4px 14px;border-radius:999px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;}
.ncn-h2{font-size:clamp(20px,4vw,28px);font-weight:900;margin:0 0 24px;}
.ncn-career{display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:16px;border:1px solid #e2e8f0;background:#fff;margin-bottom:10px;}
.ncn-star{display:inline-block;width:32px;height:32px;border-radius:10px;font-size:13px;font-weight:900;color:#fff;text-align:center;line-height:32px;flex-shrink:0;}
.ncn-cta-btn{display:block;width:100%;padding:22px 16px;border:none;border-radius:18px;background:linear-gradient(135deg,#E8A838,#f0c060);color:#1B2A4A;font-size:16px;font-weight:900;cursor:pointer;text-align:center;transition:all .2s;box-shadow:0 8px 32px rgba(232,168,56,0.35);}
.ncn-cta-btn:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(232,168,56,0.45);}
@keyframes ncnspin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
@keyframes ncnpulse{0%,100%{opacity:1}50%{opacity:0.5}}
</style>

<!-- HERO -->
<div style="background:#243049;padding-bottom:48px;">
  <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.08);">
    <span style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.4);">◀ Kết quả của bạn</span>
    <span style="font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#E8A838;">NCN ACADEMY</span>
    <span style="width:80px;"></span>
  </div>
  <div class="ncn-cont" style="text-align:center;padding-top:36px;">
    <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,0.5);margin:0 0 8px;">KẾT QUẢ CỦA BẠN</p>
    <h1 style="font-size:clamp(22px,4vw,30px);font-weight:900;color:#fff;margin:0 0 28px;">Xin chào, <span style="color:#E8A838;">${firstName}</span>!</h1>
    ${svgRing(score)}
    <p style="font-size:15px;font-weight:700;color:#fff;margin:0 0 6px;">Chỉ số phù hợp nghề nghiệp</p>
    <p style="font-size:12px;color:rgba(255,255,255,0.5);max-width:300px;margin:0 auto 20px;">Con số này cho biết câu trả lời của bạn rõ ràng đến đâu trong việc chỉ ra nhóm nghề phù hợp.</p>
    <div style="display:flex;border-radius:14px;overflow:hidden;background:rgba(255,255,255,0.07);max-width:360px;margin:0 auto;">
      <div style="flex:1;padding:12px 6px;text-align:center;${score<50?'background:rgba(255,255,255,0.07);':'opacity:0.4;'}border-right:1px solid rgba(255,255,255,0.1);"><div style="font-size:10px;font-weight:700;color:${score<50?'#ef4444':'#fff'};">Dưới 50</div><div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:2px;">Chưa rõ hướng</div></div>
      <div style="flex:1;padding:12px 6px;text-align:center;${score>=50&&score<76?'background:rgba(255,255,255,0.07);':'opacity:0.4;'}border-right:1px solid rgba(255,255,255,0.1);"><div style="font-size:10px;font-weight:700;color:${score>=50&&score<76?'#E8A838':'#fff'};">50–75</div><div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:2px;">Có xu hướng</div></div>
      <div style="flex:1;padding:12px 6px;text-align:center;${score>=76?'background:rgba(255,255,255,0.07);':'opacity:0.4;'}"><div style="font-size:10px;font-weight:700;color:${score>=76?'#2BA88C':'#fff'};">76–100</div><div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:2px;">Rõ ràng ✓</div></div>
    </div>
  </div>
</div>

<!-- INSIGHTS -->
<div class="ncn-section" style="background:#fff;">
  <div class="ncn-cont">
    <div style="text-align:center;"><span class="ncn-badge" style="background:rgba(232,168,56,0.1);color:#E8A838;border:1px solid rgba(232,168,56,0.3);">CHÂN DUNG CỦA BẠN</span><h2 class="ncn-h2" style="color:#0f172a;">Những điều có thể bạn chưa từng nghe ai nói</h2></div>
    <div id="ncn-insights-area"><div style="text-align:center;padding:24px;"><div style="width:36px;height:36px;border:3px solid #E8A838;border-top-color:transparent;border-radius:50%;animation:ncnspin 1s linear infinite;margin:0 auto 12px;"></div><p style="color:#94a3b8;font-size:13px;">Đang phân tích cá nhân hóa...</p></div></div>
    <p style="text-align:center;font-size:11px;color:#94a3b8;margin:16px 0 0;">* Phân tích CÁ NHÂN HÓA — không phải mô tả chung áp dụng cho bất kỳ ai.</p>
  </div>
</div>

<!-- TOP 5 CAREERS -->
<div class="ncn-section" style="background:#f8fafc;">
  <div class="ncn-cont">
    <div style="text-align:center;"><span class="ncn-badge" style="background:rgba(43,168,140,0.1);color:#2BA88C;border:1px solid rgba(43,168,140,0.3);">GỢI Ý NGHỀ NGHIỆP</span><h2 class="ncn-h2" style="color:#0f172a;">5 nghề phù hợp nhất với bạn</h2></div>
    <div id="ncn-careers-area">${[1,2,3,4,5].map(i=>`<div style="height:58px;background:#e2e8f0;border-radius:16px;margin-bottom:10px;animation:ncnpulse 1.5s ease-in-out infinite;"></div>`).join('')}</div>
    <div style="display:flex;align-items:center;gap:12px;padding:16px;border-radius:16px;background:#fef2f2;border:1px solid #fecaca;margin-top:4px;">
      <span style="font-size:24px;flex-shrink:0;">🚫</span>
      <div style="flex:1;"><p style="font-weight:700;font-size:14px;color:#0f172a;margin:0 0 4px;">3 nghề bạn nên tránh</p><p style="font-size:12px;color:#6b7280;margin:0;">Những ngành trông hấp dẫn nhưng sẽ khiến bạn chán sau 1–2 năm — có trong báo cáo đầy đủ</p></div>
      <span style="color:#fca5a5;flex-shrink:0;">🔒</span>
    </div>
  </div>
</div>

<!-- RISK -->
<div class="ncn-section" style="background:#243049;">
  <div class="ncn-cont">
    <div style="text-align:center;margin-bottom:24px;"><span class="ncn-badge" style="background:rgba(232,168,56,0.15);color:#E8A838;border:1px solid rgba(232,168,56,0.4);">⚠️ CẢNH BÁO</span><h2 class="ncn-h2" style="color:#fff;">Rủi ro lớn nhất nếu bạn chọn sai ngành</h2></div>
    <div id="ncn-risk-area" style="text-align:center;margin-bottom:32px;"><div style="width:36px;height:36px;border:3px solid #E8A838;border-top-color:transparent;border-radius:50%;animation:ncnspin 1s linear infinite;margin:0 auto 12px;"></div><p style="color:rgba(255,255,255,0.5);font-size:13px;">Đang tải...</p></div>
    ${[['⏳','Mất 4 năm thanh xuân','Học ngành không phù hợp, mỗi ngày đến trường đều mệt mỏi'],['💸','Mất hàng trăm triệu đồng','Học phí + sinh hoạt phí + chi phí cơ hội nếu phải học lại'],['😞','Ra trường làm trái nghề','Không có động lực, thu nhập thấp, muốn chuyển ngành nhưng đã muộn']].map(([icon,title,desc])=>`<div style="display:flex;gap:12px;padding:14px 16px;border-radius:12px;background:rgba(255,255,255,0.06);border-left:3px solid #E8A838;margin-bottom:10px;"><span style="font-size:20px;flex-shrink:0;">${icon}</span><div><p style="font-weight:700;font-size:14px;color:#fff;margin:0 0 3px;">${title}</p><p style="font-size:12px;color:rgba(255,255,255,0.55);margin:0;">${desc}</p></div></div>`).join('')}
  </div>
</div>

<!-- OPPORTUNITY -->
<div class="ncn-section" style="background:#fff;">
  <div class="ncn-cont">
    <div style="text-align:center;"><span class="ncn-badge" style="background:rgba(43,168,140,0.1);color:#2BA88C;border:1px solid rgba(43,168,140,0.3);">CƠ HỘI</span><h2 class="ncn-h2" style="color:#0f172a;">Nếu chọn đúng ngành, bạn có thể...</h2></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;">${[['🎯','Tự tin suốt 4 năm ĐH','Biết mình đang đi đúng hướng, không hoang mang giữa chừng'],['💰','Thu nhập cao hơn 30–50%','So với người làm trái ngành (thống kê VietnamWorks 2024)'],['🚀','Phát triển nhanh hơn','Vì bạn đang chơi trên sân mạnh nhất của mình']].map(([icon,title,desc])=>`<div style="padding:20px 16px;border-radius:18px;background:#f0fdf9;border:1px solid #d1fae5;"><div style="font-size:28px;margin-bottom:12px;">${icon}</div><p style="font-weight:700;font-size:14px;color:#0f172a;margin:0 0 6px;">${title}</p><p style="font-size:12px;color:#6b7280;margin:0;">${desc}</p></div>`).join('')}</div>
  </div>
</div>

<!-- SOCIAL PROOF -->
<div class="ncn-section" style="background:#f8fafc;">
  <div class="ncn-cont">
    <div style="text-align:center;"><span class="ncn-badge" style="background:rgba(232,168,56,0.1);color:#E8A838;border:1px solid rgba(232,168,56,0.3);">BẰNG CHỨNG</span><h2 class="ncn-h2" style="color:#0f172a;">Hàng ngàn học sinh đã hành động</h2></div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:28px;">${[['2.840+','bài test đã hoàn thành'],['94%','tự tin hơn khi chọn ngành'],['4.8/5 ⭐','đánh giá từ phụ huynh']].map(([num,label])=>`<div style="text-align:center;"><div style="font-size:clamp(18px,4vw,24px);font-weight:900;color:#0f172a;">${num}</div><div style="font-size:11px;color:#6b7280;margin-top:4px;">${label}</div></div>`).join('')}</div>
    ${[['Phụ huynh em Thanh Hà','Hà Nội','Con đọc xong bỏ ngay ý định thi Kinh tế vì biết mình thuộc nhóm sáng tạo. Giờ con đang học Truyền thông và rất hạnh phúc.'],['Em Đức Minh','Lớp 11, TP.HCM','Em cứ nghĩ mình phải thi Y vì ba mẹ muốn. Báo cáo chỉ ra em thuộc nhóm Nghiên cứu-Nghệ thuật. Em đã nói chuyện lại với ba mẹ.'],['Phụ huynh em Khánh Linh','Hà Giang','Chỉ hơn 500k mà tránh được 4 năm học sai ngành. Đáng lắm. Chúng tôi đã mua cho cả 2 con.']].map(([name,loc,text])=>`<div style="padding:18px;border-radius:16px;background:#fff;border:1px solid #e2e8f0;margin-bottom:12px;"><div style="display:flex;gap:2px;margin-bottom:10px;">${'⭐'.repeat(5)}</div><p style="font-size:14px;color:#374151;line-height:1.6;margin-bottom:12px;">"${text}"</p><p style="font-size:12px;font-weight:700;color:#0f172a;margin:0;">${name}</p><p style="font-size:11px;color:#9ca3af;margin:2px 0 0;">${loc}</p></div>`).join('')}
  </div>
</div>

<!-- REPORT CONTENTS -->
<div class="ncn-section" style="background:#fff;">
  <div class="ncn-cont">
    <div style="text-align:center;"><span class="ncn-badge" style="background:rgba(232,168,56,0.1);color:#E8A838;border:1px solid rgba(232,168,56,0.3);">BÁO CÁO ĐẦY ĐỦ BAO GỒM</span><h2 class="ncn-h2" style="color:#0f172a;">Toàn bộ bản đồ sự nghiệp — cá nhân hóa cho bạn</h2></div>
    <div style="border-radius:18px;overflow:hidden;border:1px solid #e2e8f0;">${['5 nghề phù hợp nhất — phân tích chi tiết từng nghề','3 nghề nên tránh — và lý do cụ thể','Môi trường làm việc tối ưu cho tính cách của bạn','Lộ trình: ngành học → nghề nghiệp → mức thu nhập','Chiến lược phát triển sự nghiệp 5 năm tới'].map((item,i)=>`<div style="display:flex;align-items:center;gap:12px;padding:16px 20px;${i<4?'border-bottom:1px solid #f1f5f9;':''}"><span style="color:#2BA88C;font-size:16px;flex-shrink:0;">✓</span><span style="font-size:14px;color:#374151;">${item}</span></div>`).join('')}</div>
  </div>
</div>

<!-- CTA -->
<div style="background:linear-gradient(135deg,#1B2A4A 0%,#2d4a7a 100%);padding:56px 20px;">
  <div style="max-width:560px;margin:0 auto;text-align:center;">
    <div style="display:inline-flex;align-items:center;gap:10px;padding:10px 18px;border-radius:12px;background:rgba(232,168,56,0.12);border:1px solid rgba(232,168,56,0.3);margin-bottom:24px;">
      <span style="font-size:11px;font-weight:700;color:#E8A838;text-transform:uppercase;">⚡ ƯU ĐÃI HẾT HẠN TRONG</span>
      <span id="ncn-countdown" style="font-family:monospace;font-size:18px;font-weight:900;color:#fff;">00:00:00</span>
    </div>
    <div style="margin-bottom:20px;">
      <div style="display:inline-block;padding:4px 14px;border-radius:999px;background:rgba(43,168,140,0.15);border:1px solid rgba(43,168,140,0.3);margin-bottom:12px;"><span style="font-size:12px;font-weight:700;color:#2BA88C;">Tiết kiệm 790.000đ</span></div>
      <div style="display:flex;align-items:baseline;justify-content:center;gap:12px;"><span style="text-decoration:line-through;color:rgba(255,255,255,0.4);font-size:16px;">1.358.000đ</span><span style="font-size:clamp(32px,7vw,44px);font-weight:900;color:#E8A838;">799.000đ</span></div>
      <p style="font-size:14px;color:rgba(255,255,255,0.6);max-width:400px;margin:12px auto 0;">Chỉ hơn 500k để tránh quyết định sai có thể khiến bạn mất 4 năm đại học và hàng trăm triệu đồng.</p>
    </div>
    <button class="ncn-cta-btn" id="ncn-main-cta">XEM NGAY 5 NGHỀ PHÙ HỢP NHẤT VỚI BẠN<br><span style="font-size:12px;font-weight:600;opacity:0.8;">& ĐỊNH HƯỚNG PHÁT TRIỂN TRONG TƯƠNG LAI</span></button>
    <p style="font-size:11px;color:rgba(255,255,255,0.35);margin-top:12px;">Nhận file PDF trong 30 giây · Thanh toán bảo mật</p>
    <p style="font-size:14px;font-weight:700;color:#E8A838;margin-top:16px;">⚡ Đừng bỏ lỡ tương lai chỉ vì sự chần chừ của hôm nay.</p>
  </div>
</div>
<div style="background:#1B2A4A;padding:20px;text-align:center;"><p style="color:rgba(255,255,255,0.25);font-size:12px;margin:0;">© NCN Academy — Nghề Chọn Người</p></div>`;

    document.getElementById('ncn-main-cta').onclick = () => openCheckout(payload);
    window._ncnOpenCheckout = () => openCheckout(payload);
    startCountdown();
    fetchAiData(payload).then(ai => { renderInsights(ai); renderCareers(ai); renderRisk(ai); });
  }

  function renderInsights(ai) {
    const area = document.getElementById('ncn-insights-area'); if (!area) return;
    const ins = ai && ai.insights;
    area.innerHTML = [['🪞', ins && ins.insight_1], ['🧭', ins && ins.insight_2], ['💡', ins && ins.insight_3]].filter(([,t]) => t).map(([icon,text]) => `<div style="display:flex;gap:14px;padding:18px;border-radius:16px;background:#fffbf0;border:1px solid #f0e6d0;margin-bottom:12px;"><span style="font-size:24px;flex-shrink:0;">${icon}</span><p style="font-size:14px;line-height:1.6;color:#374151;margin:0;">${text}</p></div>`).join('') || '<p style="color:#94a3b8;text-align:center;font-size:13px;">Đang phân tích...</p>';
  }

  function renderCareers(ai) {
    const area = document.getElementById('ncn-careers-area'); if (!area) return;
    const careers = ai && ai.careers && ai.careers.top_careers;
    if (!careers || !careers.length) { area.innerHTML = '<p style="color:#94a3b8;font-size:13px;text-align:center;">Đang tải...</p>'; return; }
    area.innerHTML = careers.map(c => c.locked
      ? `<div class="ncn-career" style="opacity:.7;background:#f1f5f9;border-style:dashed;cursor:pointer;" onclick="window._ncnOpenCheckout&&window._ncnOpenCheckout()"><div class="ncn-star" style="background:#cbd5e1;">${c.rank}</div><div style="flex:1;"><div style="display:flex;align-items:center;gap:6px;"><span>🔒</span><span style="font-size:13px;font-weight:700;color:#94a3b8;">Nghề phù hợp #${c.rank} — phù hợp hơn cả 3 nghề bên dưới</span></div><p style="font-size:11px;color:#94a3b8;margin:3px 0 0;">Mở khóa trong báo cáo đầy đủ</p></div><div style="text-align:right;flex-shrink:0;"><div style="font-weight:900;color:#94a3b8;">${c.match}%</div><div style="font-size:10px;color:#cbd5e1;">phù hợp</div></div></div>`
      : `<div class="ncn-career"><div class="ncn-star" style="background:#2BA88C;">${c.rank}</div><div style="flex:1;"><p style="font-size:14px;font-weight:700;color:#0f172a;margin:0 0 3px;">${c.title}</p><p style="font-size:12px;color:#6b7280;margin:0;">${c.reason}</p></div><div style="text-align:right;flex-shrink:0;"><div style="font-size:14px;font-weight:900;color:#2BA88C;">${c.match}%</div><div style="font-size:11px;color:#9ca3af;">phù hợp</div></div></div>`
    ).join('');
  }

  function renderRisk(ai) {
    const area = document.getElementById('ncn-risk-area'); if (!area) return;
    const risk = ai && ai.risk;
    area.innerHTML = `<div style="font-size:56px;font-weight:900;color:#E8A838;margin-bottom:12px;">${(risk && risk.risk_percent) || 73}%</div><p style="font-size:14px;color:rgba(255,255,255,0.65);max-width:380px;margin:0 auto;">${(risk && risk.risk_description) || 'Người có kết quả giống bạn thường chọn sai ngành vì bị ảnh hưởng bởi áp lực gia đình thay vì lắng nghe bản thân.'}</p>`;
  }

  function waitForResult() {
    const reportEl = document.getElementById('report-container');
    if (!reportEl) { setTimeout(waitForResult, 500); return; }
    const observer = new MutationObserver(mutations => {
      for (const m of mutations) {
        if (m.attributeName === 'class' && !reportEl.classList.contains('hidden')) {
          observer.disconnect();
          setTimeout(() => { if (window.pdfPayload) renderResultPage(window.pdfPayload); }, 300);
          break;
        }
      }
    });
    observer.observe(reportEl, { attributes: true });
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', waitForResult); }
  else { waitForResult(); }
})();
