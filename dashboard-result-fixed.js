/**
 * dashboard-result.js â€” NCN Academy Result Redesign v1.0
 * Intercept report-container khi hiá»ƒn thá»‹, render láº¡i 8 sections má»›i.
 * KHÃ”NG Ä‘á»¥ng vÃ o script.js gá»‘c.
 */
(function () {
  'use strict';

  // â”€â”€ GiÃ¡ theo chiáº¿n dá»‹ch â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const CAMPAIGN_START = new Date('2026-07-15T00:00:00+07:00');
  const CAMPAIGN_END   = new Date('2026-07-28T23:59:59+07:00');
  const now = new Date();
  const IS_CAMPAIGN = now >= CAMPAIGN_START && now <= CAMPAIGN_END;
  const PRICE = IS_CAMPAIGN ? 399000 : 799000;
  const PRICE_DISPLAY = IS_CAMPAIGN ? '399.000Ä‘' : '799.000Ä‘';
  const PRICE_ORIGINAL_DISPLAY = IS_CAMPAIGN ? '799.000Ä‘' : '1.358.000Ä‘';
  // â”€â”€ NgÃ¢n hÃ ng MB Bank â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      if (el) el.textContent = remaining === 0 ? 'Æ¯U ÄÃƒI ÄÃƒ Háº¾T Háº N' : `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
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
    modal.innerHTML = `<div style="background:#1e293b;color:#fff;border-radius:20px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto;"><div style="display:flex;align-items:center;justify-content:space-between;padding:20px;border-bottom:1px solid rgba(255,255,255,0.1);position:sticky;top:0;background:#1e293b;z-index:1;"><div><p style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:#E8A838;margin:0 0 4px;">Má»ž KHÃ“A BÃO CÃO Äáº¦Y Äá»¦</p><p style="font-size:15px;font-weight:900;color:#fff;margin:0;">Báº£n Ä‘á»“ sá»± nghiá»‡p cÃ¡ nhÃ¢n hÃ³a</p></div><button id="ncn-modal-close" style="background:rgba(255,255,255,0.08);border:none;color:#fff;border-radius:50%;width:32px;height:32px;font-size:18px;cursor:pointer;">âœ•</button></div><div id="ncn-modal-body" style="padding:20px;"><div style="background:rgba(255,255,255,0.06);border-radius:12px;padding:16px;margin-bottom:16px;"><p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin:0 0 12px;">ðŸ“„ BÃO CÃO BAO Gá»’M</p>${['5 nghá» phÃ¹ há»£p nháº¥t â€” phÃ¢n tÃ­ch chi tiáº¿t','3 nghá» nÃªn trÃ¡nh â€” vÃ  lÃ½ do cá»¥ thá»ƒ','MÃ´i trÆ°á»ng lÃ m viá»‡c tá»‘i Æ°u','Lá»™ trÃ¬nh ngÃ nh há»c â†’ nghá» nghiá»‡p â†’ thu nháº­p','Chiáº¿n lÆ°á»£c phÃ¡t triá»ƒn sá»± nghiá»‡p 5 nÄƒm'].map(t=>`<div style="display:flex;gap:8px;margin-bottom:8px;"><span style="color:#2BA88C;">âœ“</span><span style="font-size:13px;color:rgba(255,255,255,0.8);">${t}</span></div>`).join('')}</div><div style="text-align:center;margin-bottom:16px;"><span style="text-decoration:line-through;color:rgba(255,255,255,0.4);font-size:14px;margin-right:10px;">1.358.000Ä‘</span><span id="ncn-price-display" style="font-size:32px;font-weight:900;color:#E8A838;">799.000Ä‘</span></div><div style="display:flex;gap:8px;margin-bottom:8px;"><input id="ncn-coupon" type="text" placeholder="Nháº­p mÃ£ Æ°u Ä‘Ã£i (náº¿u cÃ³)" style="flex:1;padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:#0f172a;color:#fff;font-size:13px;outline:none;"><button id="ncn-coupon-btn" style="background:#3b82f6;color:#fff;border:none;padding:10px 16px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;">Ãp dá»¥ng</button></div><p id="ncn-coupon-msg" style="font-size:12px;margin:0 0 12px;min-height:16px;"></p><p id="ncn-modal-error" style="color:#f87171;font-size:13px;background:rgba(248,113,113,0.1);border-radius:8px;padding:8px 12px;display:none;margin-bottom:12px;"></p><button id="ncn-pay-btn" style="width:100%;padding:18px;border-radius:14px;border:none;background:linear-gradient(135deg,#E8A838,#f0c060);color:#1B2A4A;font-size:16px;font-weight:900;cursor:pointer;">ðŸ”“ THANH TOÃN QUA MÃƒ QR</button><p style="text-align:center;font-size:11px;color:rgba(255,255,255,0.3);margin-top:10px;">Nháº­n file PDF trong 30 giÃ¢y Â· Thanh toÃ¡n báº£o máº­t</p></div></div>`;
    document.body.appendChild(modal);
    document.getElementById('ncn-modal-close').onclick = () => modal.remove();
    modal.onclick = e => { if (e.target === modal) modal.remove(); };
    document.getElementById('ncn-coupon-btn').onclick = async () => {
      const code = (document.getElementById('ncn-coupon').value || '').trim().toUpperCase();
      const msgEl = document.getElementById('ncn-coupon-msg');
      if (!code) { msgEl.textContent = 'Vui lÃ²ng nháº­p mÃ£'; msgEl.style.color = '#f87171'; return; }
      try {
        const res = await fetch(`${API_BASE}/apply-coupon`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ coupon: code, orderCode: String(orderCodeNum) }) });
        const d = await res.json();
        if (d.success) { finalAmount = 0; document.getElementById('ncn-price-display').textContent = 'MIá»„N PHÃ'; document.getElementById('ncn-pay-btn').textContent = 'ðŸ”“ NHáº¬N BÃO CÃO MIá»„N PHÃ'; msgEl.textContent = 'âœ… MÃ£ há»£p lá»‡! Miá»…n phÃ­ 100%'; msgEl.style.color = '#34d399'; }
        else { msgEl.textContent = 'âŒ ' + (d.message || 'MÃ£ khÃ´ng há»£p lá»‡'); msgEl.style.color = '#f87171'; }
      } catch { msgEl.textContent = 'âŒ Lá»—i kiá»ƒm tra mÃ£'; msgEl.style.color = '#f87171'; }
    };
    document.getElementById('ncn-pay-btn').onclick = async () => {
      const btn = document.getElementById('ncn-pay-btn'); const errEl = document.getElementById('ncn-modal-error');
      btn.disabled = true; btn.textContent = 'â³ Äang xá»­ lÃ½...'; errEl.style.display = 'none';
      try {
        await fetch(`${API_BASE}/create-order`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ orderCode: orderCodeNum, orderId: `NCN-${orderCodeNum}`, amount: finalAmount, customerName: payload.HOTEN || '', customerEmail: payload.EMAIL || '', customerPhone: payload.DIEN_THOAI || '', payload }) });
        if (finalAmount === 0) {
          document.getElementById('ncn-modal-body').innerHTML = '<div style="text-align:center;padding:32px 16px;"><div style="font-size:48px;margin-bottom:16px;">â³</div><p style="font-weight:800;font-size:18px;color:#fff;">Äang táº¡o bÃ¡o cÃ¡o...</p></div>';
          const pdfRes = await fetch(`${API_BASE}/generate-pdf`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
          if (!pdfRes.ok) throw new Error('Lá»—i táº¡o PDF');
          showDone(URL.createObjectURL(await pdfRes.blob()), payload.HOTEN || 'BaoCao'); return;
        }
        // Táº¡o QR VietQR trá»±c tiáº¿p â€” MB Bank, khÃ´ng cáº§n PayOS
        const desc = `NCN ${orderCodeNum}`;
        const qrUrl = `https://img.vietqr.io/image/${BANK_BIN}-${BANK_ACCT}-compact2.png?amount=${finalAmount}&addInfo=${encodeURIComponent(desc)}&accountName=${encodeURIComponent(BANK_OWNER)}`;
        showQR(qrUrl, desc, finalAmount, orderCodeNum, payload);
      } catch (err) { btn.disabled = false; btn.textContent = 'ðŸ”“ THANH TOÃN QUA MÃƒ QR'; errEl.textContent = err.message || 'CÃ³ lá»—i, vui lÃ²ng thá»­ láº¡i'; errEl.style.display = 'block'; }
    };
  }

  function showQR(qrUrl, desc, amt, oc, payload) {
    const body = document.getElementById('ncn-modal-body'); if (!body) return;
    body.innerHTML = `<div style="text-align:center;"><p style="font-weight:800;font-size:18px;color:#fff;margin-bottom:4px;">QuÃ©t mÃ£ QR Ä‘á»ƒ thanh toÃ¡n</p><p style="color:rgba(255,255,255,0.6);font-size:14px;margin-bottom:16px;">Sá»‘ tiá»n: <strong style="color:#fff;">${Number(amt).toLocaleString('vi-VN')} VNÄ</strong></p><div style="display:inline-block;border:4px solid #fff;border-radius:12px;overflow:hidden;margin-bottom:16px;"><img src="${qrUrl}" alt="QR" style="width:220px;height:220px;display:block;"></div><div style="background:rgba(255,255,255,0.06);border-radius:10px;padding:12px;margin-bottom:16px;"><p style="color:#94a3b8;font-size:12px;margin:0 0 4px;">Ná»™i dung chuyá»ƒn khoáº£n:</p><p style="font-weight:800;color:#fff;font-size:16px;margin:0;">${desc}</p></div><div style="display:flex;align-items:center;justify-content:center;gap:8px;color:#E8A838;font-weight:700;font-size:14px;"><div style="width:16px;height:16px;border:2px solid #E8A838;border-top-color:transparent;border-radius:50%;animation:ncnspin 1s linear infinite;"></div>Äang chá» thanh toÃ¡n...</div></div><style>@keyframes ncnspin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style>`;
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
    body.innerHTML = `<div style="text-align:center;padding:32px 0;"><div style="width:64px;height:64px;background:rgba(43,168,140,0.15);border:2px solid #2BA88C;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:32px;">âœ“</div><p style="font-weight:900;font-size:20px;color:#fff;margin-bottom:8px;">BÃ¡o cÃ¡o Ä‘Ã£ sáºµn sÃ ng! ðŸŽ‰</p><p style="color:rgba(255,255,255,0.6);font-size:14px;margin-bottom:24px;">BÃ¡o cÃ¡o Ä‘Ã£ Ä‘Æ°á»£c gá»­i vá» email cá»§a báº¡n.</p>${url?`<a href="${url}" download="Bao-Cao-NCN-${safe}.pdf" style="display:inline-block;padding:16px 32px;border-radius:14px;background:linear-gradient(135deg,#2BA88C,#1e8a72);color:#fff;text-decoration:none;font-weight:900;font-size:16px;">ðŸ“¥ LÆ¯U BÃO CÃO Vá»€ MÃY</a>`:''}</div>`;
  }

  function renderResultPage(payload) {
    const container = document.getElementById('report-container'); if (!container) return;
    const score = calcMatchScore(payload);
    const firstName = (payload.HOTEN || 'báº¡n').split(' ').pop();
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
    <span style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.4);">â—€ Káº¿t quáº£ cá»§a báº¡n</span>
    <span style="font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#E8A838;">NCN ACADEMY</span>
    <span style="width:80px;"></span>
  </div>
  <div class="ncn-cont" style="text-align:center;padding-top:36px;">
    <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,0.5);margin:0 0 8px;">Káº¾T QUáº¢ Cá»¦A Báº N</p>
    <h1 style="font-size:clamp(22px,4vw,30px);font-weight:900;color:#fff;margin:0 0 28px;">Xin chÃ o, <span style="color:#E8A838;">${firstName}</span>!</h1>
    ${svgRing(score)}
    <p style="font-size:15px;font-weight:700;color:#fff;margin:0 0 6px;">Chá»‰ sá»‘ phÃ¹ há»£p nghá» nghiá»‡p</p>
    <p style="font-size:12px;color:rgba(255,255,255,0.5);max-width:300px;margin:0 auto 20px;">Con sá»‘ nÃ y cho biáº¿t cÃ¢u tráº£ lá»i cá»§a báº¡n rÃµ rÃ ng Ä‘áº¿n Ä‘Ã¢u trong viá»‡c chá»‰ ra nhÃ³m nghá» phÃ¹ há»£p.</p>
    <div style="display:flex;border-radius:14px;overflow:hidden;background:rgba(255,255,255,0.07);max-width:360px;margin:0 auto;">
      <div style="flex:1;padding:12px 6px;text-align:center;${score<50?'background:rgba(255,255,255,0.07);':'opacity:0.4;'}border-right:1px solid rgba(255,255,255,0.1);"><div style="font-size:10px;font-weight:700;color:${score<50?'#ef4444':'#fff'};">DÆ°á»›i 50</div><div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:2px;">ChÆ°a rÃµ hÆ°á»›ng</div></div>
      <div style="flex:1;padding:12px 6px;text-align:center;${score>=50&&score<76?'background:rgba(255,255,255,0.07);':'opacity:0.4;'}border-right:1px solid rgba(255,255,255,0.1);"><div style="font-size:10px;font-weight:700;color:${score>=50&&score<76?'#E8A838':'#fff'};">50â€“75</div><div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:2px;">CÃ³ xu hÆ°á»›ng</div></div>
      <div style="flex:1;padding:12px 6px;text-align:center;${score>=76?'background:rgba(255,255,255,0.07);':'opacity:0.4;'}"><div style="font-size:10px;font-weight:700;color:${score>=76?'#2BA88C':'#fff'};">76â€“100</div><div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:2px;">RÃµ rÃ ng âœ“</div></div>
    </div>
  </div>
</div>

<!-- INSIGHTS -->
<div class="ncn-section" style="background:#fff;">
  <div class="ncn-cont">
    <div style="text-align:center;"><span class="ncn-badge" style="background:rgba(232,168,56,0.1);color:#E8A838;border:1px solid rgba(232,168,56,0.3);">CHÃ‚N DUNG Cá»¦A Báº N</span><h2 class="ncn-h2" style="color:#0f172a;">Nhá»¯ng Ä‘iá»u cÃ³ thá»ƒ báº¡n chÆ°a tá»«ng nghe ai nÃ³i</h2></div>
    <div id="ncn-insights-area"><div style="text-align:center;padding:24px;"><div style="width:36px;height:36px;border:3px solid #E8A838;border-top-color:transparent;border-radius:50%;animation:ncnspin 1s linear infinite;margin:0 auto 12px;"></div><p style="color:#94a3b8;font-size:13px;">Äang phÃ¢n tÃ­ch cÃ¡ nhÃ¢n hÃ³a...</p></div></div>
    <p style="text-align:center;font-size:11px;color:#94a3b8;margin:16px 0 0;">* PhÃ¢n tÃ­ch CÃ NHÃ‚N HÃ“A â€” khÃ´ng pháº£i mÃ´ táº£ chung Ã¡p dá»¥ng cho báº¥t ká»³ ai.</p>
  </div>
</div>

<!-- TOP 5 CAREERS -->
<div class="ncn-section" style="background:#f8fafc;">
  <div class="ncn-cont">
    <div style="text-align:center;"><span class="ncn-badge" style="background:rgba(43,168,140,0.1);color:#2BA88C;border:1px solid rgba(43,168,140,0.3);">Gá»¢I Ã NGHá»€ NGHIá»†P</span><h2 class="ncn-h2" style="color:#0f172a;">5 nghá» phÃ¹ há»£p nháº¥t vá»›i báº¡n</h2></div>
    <div id="ncn-careers-area">${[1,2,3,4,5].map(i=>`<div style="height:58px;background:#e2e8f0;border-radius:16px;margin-bottom:10px;animation:ncnpulse 1.5s ease-in-out infinite;"></div>`).join('')}</div>
    <div style="display:flex;align-items:center;gap:12px;padding:16px;border-radius:16px;background:#fef2f2;border:1px solid #fecaca;margin-top:4px;">
      <span style="font-size:24px;flex-shrink:0;">ðŸš«</span>
      <div style="flex:1;"><p style="font-weight:700;font-size:14px;color:#0f172a;margin:0 0 4px;">3 nghá» báº¡n nÃªn trÃ¡nh</p><p style="font-size:12px;color:#6b7280;margin:0;">Nhá»¯ng ngÃ nh trÃ´ng háº¥p dáº«n nhÆ°ng sáº½ khiáº¿n báº¡n chÃ¡n sau 1â€“2 nÄƒm â€” cÃ³ trong bÃ¡o cÃ¡o Ä‘áº§y Ä‘á»§</p></div>
      <span style="color:#fca5a5;flex-shrink:0;">ðŸ”’</span>
    </div>
  </div>
</div>

<!-- RISK -->
<div class="ncn-section" style="background:#243049;">
  <div class="ncn-cont">
    <div style="text-align:center;margin-bottom:24px;"><span class="ncn-badge" style="background:rgba(232,168,56,0.15);color:#E8A838;border:1px solid rgba(232,168,56,0.4);">âš ï¸ Cáº¢NH BÃO</span><h2 class="ncn-h2" style="color:#fff;">Rá»§i ro lá»›n nháº¥t náº¿u báº¡n chá»n sai ngÃ nh</h2></div>
    <div id="ncn-risk-area" style="text-align:center;margin-bottom:32px;"><div style="width:36px;height:36px;border:3px solid #E8A838;border-top-color:transparent;border-radius:50%;animation:ncnspin 1s linear infinite;margin:0 auto 12px;"></div><p style="color:rgba(255,255,255,0.5);font-size:13px;">Äang táº£i...</p></div>
    ${[['â³','Máº¥t 4 nÄƒm thanh xuÃ¢n','Há»c ngÃ nh khÃ´ng phÃ¹ há»£p, má»—i ngÃ y Ä‘áº¿n trÆ°á»ng Ä‘á»u má»‡t má»i'],['ðŸ’¸','Máº¥t hÃ ng trÄƒm triá»‡u Ä‘á»“ng','Há»c phÃ­ + sinh hoáº¡t phÃ­ + chi phÃ­ cÆ¡ há»™i náº¿u pháº£i há»c láº¡i'],['ðŸ˜ž','Ra trÆ°á»ng lÃ m trÃ¡i nghá»','KhÃ´ng cÃ³ Ä‘á»™ng lá»±c, thu nháº­p tháº¥p, muá»‘n chuyá»ƒn ngÃ nh nhÆ°ng Ä‘Ã£ muá»™n']].map(([icon,title,desc])=>`<div style="display:flex;gap:12px;padding:14px 16px;border-radius:12px;background:rgba(255,255,255,0.06);border-left:3px solid #E8A838;margin-bottom:10px;"><span style="font-size:20px;flex-shrink:0;">${icon}</span><div><p style="font-weight:700;font-size:14px;color:#fff;margin:0 0 3px;">${title}</p><p style="font-size:12px;color:rgba(255,255,255,0.55);margin:0;">${desc}</p></div></div>`).join('')}
  </div>
</div>

<!-- OPPORTUNITY -->
<div class="ncn-section" style="background:#fff;">
  <div class="ncn-cont">
    <div style="text-align:center;"><span class="ncn-badge" style="background:rgba(43,168,140,0.1);color:#2BA88C;border:1px solid rgba(43,168,140,0.3);">CÆ  Há»˜I</span><h2 class="ncn-h2" style="color:#0f172a;">Náº¿u chá»n Ä‘Ãºng ngÃ nh, báº¡n cÃ³ thá»ƒ...</h2></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;">${[['ðŸŽ¯','Tá»± tin suá»‘t 4 nÄƒm ÄH','Biáº¿t mÃ¬nh Ä‘ang Ä‘i Ä‘Ãºng hÆ°á»›ng, khÃ´ng hoang mang giá»¯a chá»«ng'],['ðŸ’°','Thu nháº­p cao hÆ¡n 30â€“50%','So vá»›i ngÆ°á»i lÃ m trÃ¡i ngÃ nh (thá»‘ng kÃª VietnamWorks 2024)'],['ðŸš€','PhÃ¡t triá»ƒn nhanh hÆ¡n','VÃ¬ báº¡n Ä‘ang chÆ¡i trÃªn sÃ¢n máº¡nh nháº¥t cá»§a mÃ¬nh']].map(([icon,title,desc])=>`<div style="padding:20px 16px;border-radius:18px;background:#f0fdf9;border:1px solid #d1fae5;"><div style="font-size:28px;margin-bottom:12px;">${icon}</div><p style="font-weight:700;font-size:14px;color:#0f172a;margin:0 0 6px;">${title}</p><p style="font-size:12px;color:#6b7280;margin:0;">${desc}</p></div>`).join('')}</div>
  </div>
</div>

<!-- SOCIAL PROOF -->
<div class="ncn-section" style="background:#f8fafc;">
  <div class="ncn-cont">
    <div style="text-align:center;"><span class="ncn-badge" style="background:rgba(232,168,56,0.1);color:#E8A838;border:1px solid rgba(232,168,56,0.3);">Báº°NG CHá»¨NG</span><h2 class="ncn-h2" style="color:#0f172a;">HÃ ng ngÃ n há»c sinh Ä‘Ã£ hÃ nh Ä‘á»™ng</h2></div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:28px;">${[['2.840+','bÃ i test Ä‘Ã£ hoÃ n thÃ nh'],['94%','tá»± tin hÆ¡n khi chá»n ngÃ nh'],['4.8/5 â­','Ä‘Ã¡nh giÃ¡ tá»« phá»¥ huynh']].map(([num,label])=>`<div style="text-align:center;"><div style="font-size:clamp(18px,4vw,24px);font-weight:900;color:#0f172a;">${num}</div><div style="font-size:11px;color:#6b7280;margin-top:4px;">${label}</div></div>`).join('')}</div>
    ${[['Phá»¥ huynh em Thanh HÃ ','HÃ  Ná»™i','Con Ä‘á»c xong bá» ngay Ã½ Ä‘á»‹nh thi Kinh táº¿ vÃ¬ biáº¿t mÃ¬nh thuá»™c nhÃ³m sÃ¡ng táº¡o. Giá» con Ä‘ang há»c Truyá»n thÃ´ng vÃ  ráº¥t háº¡nh phÃºc.'],['Em Äá»©c Minh','Lá»›p 11, TP.HCM','Em cá»© nghÄ© mÃ¬nh pháº£i thi Y vÃ¬ ba máº¹ muá»‘n. BÃ¡o cÃ¡o chá»‰ ra em thuá»™c nhÃ³m NghiÃªn cá»©u-Nghá»‡ thuáº­t. Em Ä‘Ã£ nÃ³i chuyá»‡n láº¡i vá»›i ba máº¹.'],['Phá»¥ huynh em KhÃ¡nh Linh','HÃ  Giang','Chá»‰ hÆ¡n 500k mÃ  trÃ¡nh Ä‘Æ°á»£c 4 nÄƒm há»c sai ngÃ nh. ÄÃ¡ng láº¯m. ChÃºng tÃ´i Ä‘Ã£ mua cho cáº£ 2 con.']].map(([name,loc,text])=>`<div style="padding:18px;border-radius:16px;background:#fff;border:1px solid #e2e8f0;margin-bottom:12px;"><div style="display:flex;gap:2px;margin-bottom:10px;">${'â­'.repeat(5)}</div><p style="font-size:14px;color:#374151;line-height:1.6;margin-bottom:12px;">"${text}"</p><p style="font-size:12px;font-weight:700;color:#0f172a;margin:0;">${name}</p><p style="font-size:11px;color:#9ca3af;margin:2px 0 0;">${loc}</p></div>`).join('')}
  </div>
</div>

<!-- REPORT CONTENTS -->
<div class="ncn-section" style="background:#fff;">
  <div class="ncn-cont">
    <div style="text-align:center;"><span class="ncn-badge" style="background:rgba(232,168,56,0.1);color:#E8A838;border:1px solid rgba(232,168,56,0.3);">BÃO CÃO Äáº¦Y Äá»¦ BAO Gá»’M</span><h2 class="ncn-h2" style="color:#0f172a;">ToÃ n bá»™ báº£n Ä‘á»“ sá»± nghiá»‡p â€” cÃ¡ nhÃ¢n hÃ³a cho báº¡n</h2></div>
    <div style="border-radius:18px;overflow:hidden;border:1px solid #e2e8f0;">${['5 nghá» phÃ¹ há»£p nháº¥t â€” phÃ¢n tÃ­ch chi tiáº¿t tá»«ng nghá»','3 nghá» nÃªn trÃ¡nh â€” vÃ  lÃ½ do cá»¥ thá»ƒ','MÃ´i trÆ°á»ng lÃ m viá»‡c tá»‘i Æ°u cho tÃ­nh cÃ¡ch cá»§a báº¡n','Lá»™ trÃ¬nh: ngÃ nh há»c â†’ nghá» nghiá»‡p â†’ má»©c thu nháº­p','Chiáº¿n lÆ°á»£c phÃ¡t triá»ƒn sá»± nghiá»‡p 5 nÄƒm tá»›i'].map((item,i)=>`<div style="display:flex;align-items:center;gap:12px;padding:16px 20px;${i<4?'border-bottom:1px solid #f1f5f9;':''}"><span style="color:#2BA88C;font-size:16px;flex-shrink:0;">âœ“</span><span style="font-size:14px;color:#374151;">${item}</span></div>`).join('')}</div>
  </div>
</div>

<!-- CTA -->
<div style="background:linear-gradient(135deg,#1B2A4A 0%,#2d4a7a 100%);padding:56px 20px;">
  <div style="max-width:560px;margin:0 auto;text-align:center;">
    <div style="display:inline-flex;align-items:center;gap:10px;padding:10px 18px;border-radius:12px;background:rgba(232,168,56,0.12);border:1px solid rgba(232,168,56,0.3);margin-bottom:24px;">
      <span style="font-size:11px;font-weight:700;color:#E8A838;text-transform:uppercase;">âš¡ Æ¯U ÄÃƒI Háº¾T Háº N TRONG</span>
      <span id="ncn-countdown" style="font-family:monospace;font-size:18px;font-weight:900;color:#fff;">00:00:00</span>
    </div>
    <div style="margin-bottom:20px;">
      <div style="display:inline-block;padding:4px 14px;border-radius:999px;background:rgba(43,168,140,0.15);border:1px solid rgba(43,168,140,0.3);margin-bottom:12px;"><span style="font-size:12px;font-weight:700;color:#2BA88C;">Tiáº¿t kiá»‡m 790.000Ä‘</span></div>
      <div style="display:flex;align-items:baseline;justify-content:center;gap:12px;"><span style="text-decoration:line-through;color:rgba(255,255,255,0.4);font-size:16px;">${PRICE_ORIGINAL_DISPLAY}</span><span style="font-size:clamp(32px,7vw,44px);font-weight:900;color:#E8A838;">${PRICE_DISPLAY}</span></div>${IS_CAMPAIGN ? '<div style="margin-top:8px;text-align:center;"><span style="font-size:12px;font-weight:700;background:rgba(239,68,68,0.15);color:#f87171;border:1px solid rgba(239,68,68,0.3);padding:4px 12px;border-radius:20px;display:inline-block;">ðŸ”¥ Æ¯u Ä‘Ã£i chiáº¿n dá»‹ch Â· Káº¿t thÃºc 28/7/2026</span></div>' : ''}
      <p style="font-size:14px;color:rgba(255,255,255,0.6);max-width:400px;margin:12px auto 0;">Chá»‰ hÆ¡n 500k Ä‘á»ƒ trÃ¡nh quyáº¿t Ä‘á»‹nh sai cÃ³ thá»ƒ khiáº¿n báº¡n máº¥t 4 nÄƒm Ä‘áº¡i há»c vÃ  hÃ ng trÄƒm triá»‡u Ä‘á»“ng.</p>
    </div>
    <button class="ncn-cta-btn" id="ncn-main-cta">XEM NGAY 5 NGHá»€ PHÃ™ Há»¢P NHáº¤T Vá»šI Báº N<br><span style="font-size:12px;font-weight:600;opacity:0.8;">& Äá»ŠNH HÆ¯á»šNG PHÃT TRIá»‚N TRONG TÆ¯Æ NG LAI</span></button>
    <p style="font-size:11px;color:rgba(255,255,255,0.35);margin-top:12px;">Nháº­n file PDF trong 30 giÃ¢y Â· Thanh toÃ¡n báº£o máº­t</p>
    <p style="font-size:14px;font-weight:700;color:#E8A838;margin-top:16px;">âš¡ Äá»«ng bá» lá»¡ tÆ°Æ¡ng lai chá»‰ vÃ¬ sá»± cháº§n chá»« cá»§a hÃ´m nay.</p>
  </div>
</div>
<div style="background:#1B2A4A;padding:20px;text-align:center;"><p style="color:rgba(255,255,255,0.25);font-size:12px;margin:0;">Â© NCN Academy â€” Nghá» Chá»n NgÆ°á»i</p></div>`;

    document.getElementById('ncn-main-cta').onclick = () => openCheckout(payload);
    window._ncnOpenCheckout = () => openCheckout(payload);
    startCountdown();
    fetchAiData(payload).then(ai => { renderInsights(ai); renderCareers(ai); renderRisk(ai); });
  }

  function renderInsights(ai) {
    const area = document.getElementById('ncn-insights-area'); if (!area) return;
    const ins = ai && ai.insights;
    area.innerHTML = [['ðŸªž', ins && ins.insight_1], ['ðŸ§­', ins && ins.insight_2], ['ðŸ’¡', ins && ins.insight_3]].filter(([,t]) => t).map(([icon,text]) => `<div style="display:flex;gap:14px;padding:18px;border-radius:16px;background:#fffbf0;border:1px solid #f0e6d0;margin-bottom:12px;"><span style="font-size:24px;flex-shrink:0;">${icon}</span><p style="font-size:14px;line-height:1.6;color:#374151;margin:0;">${text}</p></div>`).join('') || '<p style="color:#94a3b8;text-align:center;font-size:13px;">Äang phÃ¢n tÃ­ch...</p>';
  }

  function renderCareers(ai) {
    const area = document.getElementById('ncn-careers-area'); if (!area) return;
    const careers = ai && ai.careers && ai.careers.top_careers;
    if (!careers || !careers.length) { area.innerHTML = '<p style="color:#94a3b8;font-size:13px;text-align:center;">Äang táº£i...</p>'; return; }
    area.innerHTML = careers.map(c => c.locked
      ? `<div class="ncn-career" style="opacity:.7;background:#f1f5f9;border-style:dashed;cursor:pointer;" onclick="window._ncnOpenCheckout&&window._ncnOpenCheckout()"><div class="ncn-star" style="background:#cbd5e1;">${c.rank}</div><div style="flex:1;"><div style="display:flex;align-items:center;gap:6px;"><span>ðŸ”’</span><span style="font-size:13px;font-weight:700;color:#94a3b8;">Nghá» phÃ¹ há»£p #${c.rank} â€” phÃ¹ há»£p hÆ¡n cáº£ 3 nghá» bÃªn dÆ°á»›i</span></div><p style="font-size:11px;color:#94a3b8;margin:3px 0 0;">Má»Ÿ khÃ³a trong bÃ¡o cÃ¡o Ä‘áº§y Ä‘á»§</p></div><div style="text-align:right;flex-shrink:0;"><div style="font-weight:900;color:#94a3b8;">${c.match}%</div><div style="font-size:10px;color:#cbd5e1;">phÃ¹ há»£p</div></div></div>`
      : `<div class="ncn-career"><div class="ncn-star" style="background:#2BA88C;">${c.rank}</div><div style="flex:1;"><p style="font-size:14px;font-weight:700;color:#0f172a;margin:0 0 3px;">${c.title}</p><p style="font-size:12px;color:#6b7280;margin:0;">${c.reason}</p></div><div style="text-align:right;flex-shrink:0;"><div style="font-size:14px;font-weight:900;color:#2BA88C;">${c.match}%</div><div style="font-size:11px;color:#9ca3af;">phÃ¹ há»£p</div></div></div>`
    ).join('');
  }

  function renderRisk(ai) {
    const area = document.getElementById('ncn-risk-area'); if (!area) return;
    const risk = ai && ai.risk;
    area.innerHTML = `<div style="font-size:56px;font-weight:900;color:#E8A838;margin-bottom:12px;">${(risk && risk.risk_percent) || 73}%</div><p style="font-size:14px;color:rgba(255,255,255,0.65);max-width:380px;margin:0 auto;">${(risk && risk.risk_description) || 'NgÆ°á»i cÃ³ káº¿t quáº£ giá»‘ng báº¡n thÆ°á»ng chá»n sai ngÃ nh vÃ¬ bá»‹ áº£nh hÆ°á»Ÿng bá»Ÿi Ã¡p lá»±c gia Ä‘Ã¬nh thay vÃ¬ láº¯ng nghe báº£n thÃ¢n.'}</p>`;
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


