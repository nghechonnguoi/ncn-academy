/**
 * dashboard-result.js Ã¢â‚¬â€ NCN Academy Result Redesign v1.0
 * Intercept report-container khi hiÃ¡Â»Æ’n thÃ¡Â»â€¹, render lÃ¡ÂºÂ¡i 8 sections mÃ¡Â»â€ºi.
 * KHÃƒâ€NG Ã„â€˜Ã¡Â»Â¥ng vÃƒÂ o script.js gÃ¡Â»â€˜c.
 */
(function () {
  'use strict';

  // Ã¢â€â‚¬Ã¢â€â‚¬ GiÃƒÂ¡ theo chiÃ¡ÂºÂ¿n dÃ¡Â»â€¹ch Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  const CAMPAIGN_START = new Date('2026-07-15T00:00:00+07:00');
  const CAMPAIGN_END   = new Date('2026-07-28T23:59:59+07:00');
  const now = new Date();
  const IS_CAMPAIGN = now >= CAMPAIGN_START && now <= CAMPAIGN_END;
  const PRICE = IS_CAMPAIGN ? 399000 : 799000;
  const PRICE_DISPLAY = IS_CAMPAIGN ? '399.000Ã„â€˜' : '799.000Ã„â€˜';
  const PRICE_ORIGINAL_DISPLAY = IS_CAMPAIGN ? '799.000Ã„â€˜' : '1.358.000Ã„â€˜';
  // Ã¢â€â‚¬Ã¢â€â‚¬ NgÃƒÂ¢n hÃƒÂ ng MB Bank Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
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
      if (el) el.textContent = remaining === 0 ? 'Ã†Â¯U Ã„ÂÃƒÆ’I Ã„ÂÃƒÆ’ HÃ¡ÂºÂ¾T HÃ¡ÂºÂ N' : `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
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
    modal.innerHTML = `<div style="background:#1e293b;color:#fff;border-radius:20px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto;"><div style="display:flex;align-items:center;justify-content:space-between;padding:20px;border-bottom:1px solid rgba(255,255,255,0.1);position:sticky;top:0;background:#1e293b;z-index:1;"><div><p style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:2px;color:#E8A838;margin:0 0 4px;">MÃ¡Â»Å¾ KHÃƒâ€œA BÃƒÂO CÃƒÂO Ã„ÂÃ¡ÂºÂ¦Y Ã„ÂÃ¡Â»Â¦</p><p style="font-size:15px;font-weight:900;color:#fff;margin:0;">BÃ¡ÂºÂ£n Ã„â€˜Ã¡Â»â€œ sÃ¡Â»Â± nghiÃ¡Â»â€¡p cÃƒÂ¡ nhÃƒÂ¢n hÃƒÂ³a</p></div><button id="ncn-modal-close" style="background:rgba(255,255,255,0.08);border:none;color:#fff;border-radius:50%;width:32px;height:32px;font-size:18px;cursor:pointer;">Ã¢Å“â€¢</button></div><div id="ncn-modal-body" style="padding:20px;"><div style="background:rgba(255,255,255,0.06);border-radius:12px;padding:16px;margin-bottom:16px;"><p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin:0 0 12px;">Ã°Å¸â€œâ€ž BÃƒÂO CÃƒÂO BAO GÃ¡Â»â€™M</p>${['5 nghÃ¡Â»Â phÃƒÂ¹ hÃ¡Â»Â£p nhÃ¡ÂºÂ¥t Ã¢â‚¬â€ phÃƒÂ¢n tÃƒÂ­ch chi tiÃ¡ÂºÂ¿t','3 nghÃ¡Â»Â nÃƒÂªn trÃƒÂ¡nh Ã¢â‚¬â€ vÃƒÂ  lÃƒÂ½ do cÃ¡Â»Â¥ thÃ¡Â»Æ’','MÃƒÂ´i trÃ†Â°Ã¡Â»Âng lÃƒÂ m viÃ¡Â»â€¡c tÃ¡Â»â€˜i Ã†Â°u','LÃ¡Â»â„¢ trÃƒÂ¬nh ngÃƒÂ nh hÃ¡Â»Âc Ã¢â€ â€™ nghÃ¡Â»Â nghiÃ¡Â»â€¡p Ã¢â€ â€™ thu nhÃ¡ÂºÂ­p','ChiÃ¡ÂºÂ¿n lÃ†Â°Ã¡Â»Â£c phÃƒÂ¡t triÃ¡Â»Æ’n sÃ¡Â»Â± nghiÃ¡Â»â€¡p 5 nÃ„Æ’m'].map(t=>`<div style="display:flex;gap:8px;margin-bottom:8px;"><span style="color:#2BA88C;">Ã¢Å“â€œ</span><span style="font-size:13px;color:rgba(255,255,255,0.8);">${t}</span></div>`).join('')}</div><div style="text-align:center;margin-bottom:16px;"><span style="text-decoration:line-through;color:rgba(255,255,255,0.4);font-size:14px;margin-right:10px;">1.358.000Ã„â€˜</span><span id="ncn-price-display" style="font-size:32px;font-weight:900;color:#E8A838;">799.000Ã„â€˜</span></div><div style="display:flex;gap:8px;margin-bottom:8px;"><input id="ncn-coupon" type="text" placeholder="NhÃ¡ÂºÂ­p mÃƒÂ£ Ã†Â°u Ã„â€˜ÃƒÂ£i (nÃ¡ÂºÂ¿u cÃƒÂ³)" style="flex:1;padding:10px 12px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:#0f172a;color:#fff;font-size:13px;outline:none;"><button id="ncn-coupon-btn" style="background:#3b82f6;color:#fff;border:none;padding:10px 16px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;">ÃƒÂp dÃ¡Â»Â¥ng</button></div><p id="ncn-coupon-msg" style="font-size:12px;margin:0 0 12px;min-height:16px;"></p><p id="ncn-modal-error" style="color:#f87171;font-size:13px;background:rgba(248,113,113,0.1);border-radius:8px;padding:8px 12px;display:none;margin-bottom:12px;"></p><button id="ncn-pay-btn" style="width:100%;padding:18px;border-radius:14px;border:none;background:linear-gradient(135deg,#E8A838,#f0c060);color:#1B2A4A;font-size:16px;font-weight:900;cursor:pointer;">Ã°Å¸â€â€œ THANH TOÃƒÂN QUA MÃƒÆ’ QR</button><p style="text-align:center;font-size:11px;color:rgba(255,255,255,0.3);margin-top:10px;">NhÃ¡ÂºÂ­n file PDF trong 30 giÃƒÂ¢y Ã‚Â· Thanh toÃƒÂ¡n bÃ¡ÂºÂ£o mÃ¡ÂºÂ­t</p></div></div>`;
    document.body.appendChild(modal);
    document.getElementById('ncn-modal-close').onclick = () => modal.remove();
    modal.onclick = e => { if (e.target === modal) modal.remove(); };
    document.getElementById('ncn-coupon-btn').onclick = async () => {
      const code = (document.getElementById('ncn-coupon').value || '').trim().toUpperCase();
      const msgEl = document.getElementById('ncn-coupon-msg');
      if (!code) { msgEl.textContent = 'Vui lÃƒÂ²ng nhÃ¡ÂºÂ­p mÃƒÂ£'; msgEl.style.color = '#f87171'; return; }
      try {
        const res = await fetch(`${API_BASE}/apply-coupon`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ coupon: code, orderCode: String(orderCodeNum) }) });
        const d = await res.json();
        if (d.success) { finalAmount = 0; document.getElementById('ncn-price-display').textContent = 'MIÃ¡Â»â€žN PHÃƒÂ'; document.getElementById('ncn-pay-btn').textContent = 'Ã°Å¸â€â€œ NHÃ¡ÂºÂ¬N BÃƒÂO CÃƒÂO MIÃ¡Â»â€žN PHÃƒÂ'; msgEl.textContent = 'Ã¢Å“â€¦ MÃƒÂ£ hÃ¡Â»Â£p lÃ¡Â»â€¡! MiÃ¡Â»â€¦n phÃƒÂ­ 100%'; msgEl.style.color = '#34d399'; }
        else { msgEl.textContent = 'Ã¢ÂÅ’ ' + (d.message || 'MÃƒÂ£ khÃƒÂ´ng hÃ¡Â»Â£p lÃ¡Â»â€¡'); msgEl.style.color = '#f87171'; }
      } catch { msgEl.textContent = 'Ã¢ÂÅ’ LÃ¡Â»â€”i kiÃ¡Â»Æ’m tra mÃƒÂ£'; msgEl.style.color = '#f87171'; }
    };
    document.getElementById('ncn-pay-btn').onclick = async () => {
      const btn = document.getElementById('ncn-pay-btn'); const errEl = document.getElementById('ncn-modal-error');
      btn.disabled = true; btn.textContent = 'Ã¢ÂÂ³ Ã„Âang xÃ¡Â»Â­ lÃƒÂ½...'; errEl.style.display = 'none';
      try {
        await fetch(`${API_BASE}/create-order`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ orderCode: orderCodeNum, orderId: `NCN-${orderCodeNum}`, amount: finalAmount, customerName: payload.HOTEN || '', customerEmail: payload.EMAIL || '', customerPhone: payload.DIEN_THOAI || '', payload }) });
        if (finalAmount === 0) {
          document.getElementById('ncn-modal-body').innerHTML = '<div style="text-align:center;padding:32px 16px;"><div style="font-size:48px;margin-bottom:16px;">Ã¢ÂÂ³</div><p style="font-weight:800;font-size:18px;color:#fff;">Ã„Âang tÃ¡ÂºÂ¡o bÃƒÂ¡o cÃƒÂ¡o...</p></div>';
          const pdfRes = await fetch(`${API_BASE}/generate-pdf`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
          if (!pdfRes.ok) throw new Error('LÃ¡Â»â€”i tÃ¡ÂºÂ¡o PDF');
          showDone(URL.createObjectURL(await pdfRes.blob()), payload.HOTEN || 'BaoCao'); return;
        }
        // TÃ¡ÂºÂ¡o QR VietQR trÃ¡Â»Â±c tiÃ¡ÂºÂ¿p Ã¢â‚¬â€ MB Bank, khÃƒÂ´ng cÃ¡ÂºÂ§n PayOS
        const desc = `NCN ${orderCodeNum}`;
        const qrUrl = `https://img.vietqr.io/image/${BANK_BIN}-${BANK_ACCT}-compact2.png?amount=${finalAmount}&addInfo=${encodeURIComponent(desc)}&accountName=${encodeURIComponent(BANK_OWNER)}`;
        showQR(qrUrl, desc, finalAmount, orderCodeNum, payload);
      } catch (err) { btn.disabled = false; btn.textContent = 'Ã°Å¸â€â€œ THANH TOÃƒÂN QUA MÃƒÆ’ QR'; errEl.textContent = err.message || 'CÃƒÂ³ lÃ¡Â»â€”i, vui lÃƒÂ²ng thÃ¡Â»Â­ lÃ¡ÂºÂ¡i'; errEl.style.display = 'block'; }
    };
  }

  function showQR(qrUrl, desc, amt, oc, payload) {
    const body = document.getElementById('ncn-modal-body'); if (!body) return;
    body.innerHTML = `<div style="text-align:center;"><p style="font-weight:800;font-size:18px;color:#fff;margin-bottom:4px;">QuÃƒÂ©t mÃƒÂ£ QR Ã„â€˜Ã¡Â»Æ’ thanh toÃƒÂ¡n</p><p style="color:rgba(255,255,255,0.6);font-size:14px;margin-bottom:16px;">SÃ¡Â»â€˜ tiÃ¡Â»Ân: <strong style="color:#fff;">${Number(amt).toLocaleString('vi-VN')} VNÃ„Â</strong></p><div style="display:inline-block;border:4px solid #fff;border-radius:12px;overflow:hidden;margin-bottom:16px;"><img src="${qrUrl}" alt="QR" style="width:220px;height:220px;display:block;"></div><div style="background:rgba(255,255,255,0.06);border-radius:10px;padding:12px;margin-bottom:16px;"><p style="color:#94a3b8;font-size:12px;margin:0 0 4px;">NÃ¡Â»â„¢i dung chuyÃ¡Â»Æ’n khoÃ¡ÂºÂ£n:</p><p style="font-weight:800;color:#fff;font-size:16px;margin:0;">${desc}</p></div><div style="display:flex;align-items:center;justify-content:center;gap:8px;color:#E8A838;font-weight:700;font-size:14px;"><div style="width:16px;height:16px;border:2px solid #E8A838;border-top-color:transparent;border-radius:50%;animation:ncnspin 1s linear infinite;"></div>Ã„Âang chÃ¡Â»Â thanh toÃƒÂ¡n...</div></div><style>@keyframes ncnspin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style>`;
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
    body.innerHTML = `<div style="text-align:center;padding:32px 0;"><div style="width:64px;height:64px;background:rgba(43,168,140,0.15);border:2px solid #2BA88C;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:32px;">Ã¢Å“â€œ</div><p style="font-weight:900;font-size:20px;color:#fff;margin-bottom:8px;">BÃƒÂ¡o cÃƒÂ¡o Ã„â€˜ÃƒÂ£ sÃ¡ÂºÂµn sÃƒÂ ng! Ã°Å¸Å½â€°</p><p style="color:rgba(255,255,255,0.6);font-size:14px;margin-bottom:24px;">BÃƒÂ¡o cÃƒÂ¡o Ã„â€˜ÃƒÂ£ Ã„â€˜Ã†Â°Ã¡Â»Â£c gÃ¡Â»Â­i vÃ¡Â»Â email cÃ¡Â»Â§a bÃ¡ÂºÂ¡n.</p>${url?`<a href="${url}" download="Bao-Cao-NCN-${safe}.pdf" style="display:inline-block;padding:16px 32px;border-radius:14px;background:linear-gradient(135deg,#2BA88C,#1e8a72);color:#fff;text-decoration:none;font-weight:900;font-size:16px;">Ã°Å¸â€œÂ¥ LÃ†Â¯U BÃƒÂO CÃƒÂO VÃ¡Â»â‚¬ MÃƒÂY</a>`:''}</div>`;
  }

  function renderResultPage(payload) {
    const container = document.getElementById('report-container'); if (!container) return;
    const score = calcMatchScore(payload);
    const firstName = (payload.HOTEN || 'bÃ¡ÂºÂ¡n').split(' ').pop();
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
    <span style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.4);">Ã¢â€”â‚¬ KÃ¡ÂºÂ¿t quÃ¡ÂºÂ£ cÃ¡Â»Â§a bÃ¡ÂºÂ¡n</span>
    <span style="font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#E8A838;">NCN ACADEMY</span>
    <span style="width:80px;"></span>
  </div>
  <div class="ncn-cont" style="text-align:center;padding-top:36px;">
    <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,0.5);margin:0 0 8px;">KÃ¡ÂºÂ¾T QUÃ¡ÂºÂ¢ CÃ¡Â»Â¦A BÃ¡ÂºÂ N</p>
    <h1 style="font-size:clamp(22px,4vw,30px);font-weight:900;color:#fff;margin:0 0 28px;">Xin chÃƒÂ o, <span style="color:#E8A838;">${firstName}</span>!</h1>
    ${svgRing(score)}
    <p style="font-size:15px;font-weight:700;color:#fff;margin:0 0 6px;">ChÃ¡Â»â€° sÃ¡Â»â€˜ phÃƒÂ¹ hÃ¡Â»Â£p nghÃ¡Â»Â nghiÃ¡Â»â€¡p</p>
    <p style="font-size:12px;color:rgba(255,255,255,0.5);max-width:300px;margin:0 auto 20px;">Con sÃ¡Â»â€˜ nÃƒÂ y cho biÃ¡ÂºÂ¿t cÃƒÂ¢u trÃ¡ÂºÂ£ lÃ¡Â»Âi cÃ¡Â»Â§a bÃ¡ÂºÂ¡n rÃƒÂµ rÃƒÂ ng Ã„â€˜Ã¡ÂºÂ¿n Ã„â€˜ÃƒÂ¢u trong viÃ¡Â»â€¡c chÃ¡Â»â€° ra nhÃƒÂ³m nghÃ¡Â»Â phÃƒÂ¹ hÃ¡Â»Â£p.</p>
    <div style="display:flex;border-radius:14px;overflow:hidden;background:rgba(255,255,255,0.07);max-width:360px;margin:0 auto;">
      <div style="flex:1;padding:12px 6px;text-align:center;${score<50?'background:rgba(255,255,255,0.07);':'opacity:0.4;'}border-right:1px solid rgba(255,255,255,0.1);"><div style="font-size:10px;font-weight:700;color:${score<50?'#ef4444':'#fff'};">DÃ†Â°Ã¡Â»â€ºi 50</div><div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:2px;">ChÃ†Â°a rÃƒÂµ hÃ†Â°Ã¡Â»â€ºng</div></div>
      <div style="flex:1;padding:12px 6px;text-align:center;${score>=50&&score<76?'background:rgba(255,255,255,0.07);':'opacity:0.4;'}border-right:1px solid rgba(255,255,255,0.1);"><div style="font-size:10px;font-weight:700;color:${score>=50&&score<76?'#E8A838':'#fff'};">50Ã¢â‚¬â€œ75</div><div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:2px;">CÃƒÂ³ xu hÃ†Â°Ã¡Â»â€ºng</div></div>
      <div style="flex:1;padding:12px 6px;text-align:center;${score>=76?'background:rgba(255,255,255,0.07);':'opacity:0.4;'}"><div style="font-size:10px;font-weight:700;color:${score>=76?'#2BA88C':'#fff'};">76Ã¢â‚¬â€œ100</div><div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:2px;">RÃƒÂµ rÃƒÂ ng Ã¢Å“â€œ</div></div>
    </div>
  </div>
</div>

<!-- INSIGHTS -->
<div class="ncn-section" style="background:#fff;">
  <div class="ncn-cont">
    <div style="text-align:center;"><span class="ncn-badge" style="background:rgba(232,168,56,0.1);color:#E8A838;border:1px solid rgba(232,168,56,0.3);">CHÃƒâ€šN DUNG CÃ¡Â»Â¦A BÃ¡ÂºÂ N</span><h2 class="ncn-h2" style="color:#0f172a;">NhÃ¡Â»Â¯ng Ã„â€˜iÃ¡Â»Âu cÃƒÂ³ thÃ¡Â»Æ’ bÃ¡ÂºÂ¡n chÃ†Â°a tÃ¡Â»Â«ng nghe ai nÃƒÂ³i</h2></div>
    <div id="ncn-insights-area"><div style="text-align:center;padding:24px;"><div style="width:36px;height:36px;border:3px solid #E8A838;border-top-color:transparent;border-radius:50%;animation:ncnspin 1s linear infinite;margin:0 auto 12px;"></div><p style="color:#94a3b8;font-size:13px;">Ã„Âang phÃƒÂ¢n tÃƒÂ­ch cÃƒÂ¡ nhÃƒÂ¢n hÃƒÂ³a...</p></div></div>
    <p style="text-align:center;font-size:11px;color:#94a3b8;margin:16px 0 0;">* PhÃƒÂ¢n tÃƒÂ­ch CÃƒÂ NHÃƒâ€šN HÃƒâ€œA Ã¢â‚¬â€ khÃƒÂ´ng phÃ¡ÂºÂ£i mÃƒÂ´ tÃ¡ÂºÂ£ chung ÃƒÂ¡p dÃ¡Â»Â¥ng cho bÃ¡ÂºÂ¥t kÃ¡Â»Â³ ai.</p>
  </div>
</div>

<!-- TOP 5 CAREERS -->
<div class="ncn-section" style="background:#f8fafc;">
  <div class="ncn-cont">
    <div style="text-align:center;"><span class="ncn-badge" style="background:rgba(43,168,140,0.1);color:#2BA88C;border:1px solid rgba(43,168,140,0.3);">GÃ¡Â»Â¢I ÃƒÂ NGHÃ¡Â»â‚¬ NGHIÃ¡Â»â€ P</span><h2 class="ncn-h2" style="color:#0f172a;">5 nghÃ¡Â»Â phÃƒÂ¹ hÃ¡Â»Â£p nhÃ¡ÂºÂ¥t vÃ¡Â»â€ºi bÃ¡ÂºÂ¡n</h2></div>
    <div id="ncn-careers-area">${[1,2,3,4,5].map(i=>`<div style="height:58px;background:#e2e8f0;border-radius:16px;margin-bottom:10px;animation:ncnpulse 1.5s ease-in-out infinite;"></div>`).join('')}</div>
    <div style="display:flex;align-items:center;gap:12px;padding:16px;border-radius:16px;background:#fef2f2;border:1px solid #fecaca;margin-top:4px;">
      <span style="font-size:24px;flex-shrink:0;">Ã°Å¸Å¡Â«</span>
      <div style="flex:1;"><p style="font-weight:700;font-size:14px;color:#0f172a;margin:0 0 4px;">3 nghÃ¡Â»Â bÃ¡ÂºÂ¡n nÃƒÂªn trÃƒÂ¡nh</p><p style="font-size:12px;color:#6b7280;margin:0;">NhÃ¡Â»Â¯ng ngÃƒÂ nh trÃƒÂ´ng hÃ¡ÂºÂ¥p dÃ¡ÂºÂ«n nhÃ†Â°ng sÃ¡ÂºÂ½ khiÃ¡ÂºÂ¿n bÃ¡ÂºÂ¡n chÃƒÂ¡n sau 1Ã¢â‚¬â€œ2 nÃ„Æ’m Ã¢â‚¬â€ cÃƒÂ³ trong bÃƒÂ¡o cÃƒÂ¡o Ã„â€˜Ã¡ÂºÂ§y Ã„â€˜Ã¡Â»Â§</p></div>
      <span style="color:#fca5a5;flex-shrink:0;">Ã°Å¸â€â€™</span>
    </div>
  </div>
</div>

<!-- RISK -->
<div class="ncn-section" style="background:#243049;">
  <div class="ncn-cont">
    <div style="text-align:center;margin-bottom:24px;"><span class="ncn-badge" style="background:rgba(232,168,56,0.15);color:#E8A838;border:1px solid rgba(232,168,56,0.4);">Ã¢Å¡Â Ã¯Â¸Â CÃ¡ÂºÂ¢NH BÃƒÂO</span><h2 class="ncn-h2" style="color:#fff;">RÃ¡Â»Â§i ro lÃ¡Â»â€ºn nhÃ¡ÂºÂ¥t nÃ¡ÂºÂ¿u bÃ¡ÂºÂ¡n chÃ¡Â»Ân sai ngÃƒÂ nh</h2></div>
    <div id="ncn-risk-area" style="text-align:center;margin-bottom:32px;"><div style="width:36px;height:36px;border:3px solid #E8A838;border-top-color:transparent;border-radius:50%;animation:ncnspin 1s linear infinite;margin:0 auto 12px;"></div><p style="color:rgba(255,255,255,0.5);font-size:13px;">Ã„Âang tÃ¡ÂºÂ£i...</p></div>
    ${[['Ã¢ÂÂ³','MÃ¡ÂºÂ¥t 4 nÃ„Æ’m thanh xuÃƒÂ¢n','HÃ¡Â»Âc ngÃƒÂ nh khÃƒÂ´ng phÃƒÂ¹ hÃ¡Â»Â£p, mÃ¡Â»â€”i ngÃƒÂ y Ã„â€˜Ã¡ÂºÂ¿n trÃ†Â°Ã¡Â»Âng Ã„â€˜Ã¡Â»Âu mÃ¡Â»â€¡t mÃ¡Â»Âi'],['Ã°Å¸â€™Â¸','MÃ¡ÂºÂ¥t hÃƒÂ ng trÃ„Æ’m triÃ¡Â»â€¡u Ã„â€˜Ã¡Â»â€œng','HÃ¡Â»Âc phÃƒÂ­ + sinh hoÃ¡ÂºÂ¡t phÃƒÂ­ + chi phÃƒÂ­ cÃ†Â¡ hÃ¡Â»â„¢i nÃ¡ÂºÂ¿u phÃ¡ÂºÂ£i hÃ¡Â»Âc lÃ¡ÂºÂ¡i'],['Ã°Å¸ËœÅ¾','Ra trÃ†Â°Ã¡Â»Âng lÃƒÂ m trÃƒÂ¡i nghÃ¡Â»Â','KhÃƒÂ´ng cÃƒÂ³ Ã„â€˜Ã¡Â»â„¢ng lÃ¡Â»Â±c, thu nhÃ¡ÂºÂ­p thÃ¡ÂºÂ¥p, muÃ¡Â»â€˜n chuyÃ¡Â»Æ’n ngÃƒÂ nh nhÃ†Â°ng Ã„â€˜ÃƒÂ£ muÃ¡Â»â„¢n']].map(([icon,title,desc])=>`<div style="display:flex;gap:12px;padding:14px 16px;border-radius:12px;background:rgba(255,255,255,0.06);border-left:3px solid #E8A838;margin-bottom:10px;"><span style="font-size:20px;flex-shrink:0;">${icon}</span><div><p style="font-weight:700;font-size:14px;color:#fff;margin:0 0 3px;">${title}</p><p style="font-size:12px;color:rgba(255,255,255,0.55);margin:0;">${desc}</p></div></div>`).join('')}
  </div>
</div>

<!-- OPPORTUNITY -->
<div class="ncn-section" style="background:#fff;">
  <div class="ncn-cont">
    <div style="text-align:center;"><span class="ncn-badge" style="background:rgba(43,168,140,0.1);color:#2BA88C;border:1px solid rgba(43,168,140,0.3);">CÃ†Â  HÃ¡Â»ËœI</span><h2 class="ncn-h2" style="color:#0f172a;">NÃ¡ÂºÂ¿u chÃ¡Â»Ân Ã„â€˜ÃƒÂºng ngÃƒÂ nh, bÃ¡ÂºÂ¡n cÃƒÂ³ thÃ¡Â»Æ’...</h2></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;">${[['Ã°Å¸Å½Â¯','TÃ¡Â»Â± tin suÃ¡Â»â€˜t 4 nÃ„Æ’m Ã„ÂH','BiÃ¡ÂºÂ¿t mÃƒÂ¬nh Ã„â€˜ang Ã„â€˜i Ã„â€˜ÃƒÂºng hÃ†Â°Ã¡Â»â€ºng, khÃƒÂ´ng hoang mang giÃ¡Â»Â¯a chÃ¡Â»Â«ng'],['Ã°Å¸â€™Â°','Thu nhÃ¡ÂºÂ­p cao hÃ†Â¡n 30Ã¢â‚¬â€œ50%','So vÃ¡Â»â€ºi ngÃ†Â°Ã¡Â»Âi lÃƒÂ m trÃƒÂ¡i ngÃƒÂ nh (thÃ¡Â»â€˜ng kÃƒÂª VietnamWorks 2024)'],['Ã°Å¸Å¡â‚¬','PhÃƒÂ¡t triÃ¡Â»Æ’n nhanh hÃ†Â¡n','VÃƒÂ¬ bÃ¡ÂºÂ¡n Ã„â€˜ang chÃ†Â¡i trÃƒÂªn sÃƒÂ¢n mÃ¡ÂºÂ¡nh nhÃ¡ÂºÂ¥t cÃ¡Â»Â§a mÃƒÂ¬nh']].map(([icon,title,desc])=>`<div style="padding:20px 16px;border-radius:18px;background:#f0fdf9;border:1px solid #d1fae5;"><div style="font-size:28px;margin-bottom:12px;">${icon}</div><p style="font-weight:700;font-size:14px;color:#0f172a;margin:0 0 6px;">${title}</p><p style="font-size:12px;color:#6b7280;margin:0;">${desc}</p></div>`).join('')}</div>
  </div>
</div>

<!-- SOCIAL PROOF -->
<div class="ncn-section" style="background:#f8fafc;">
  <div class="ncn-cont">
    <div style="text-align:center;"><span class="ncn-badge" style="background:rgba(232,168,56,0.1);color:#E8A838;border:1px solid rgba(232,168,56,0.3);">BÃ¡ÂºÂ°NG CHÃ¡Â»Â¨NG</span><h2 class="ncn-h2" style="color:#0f172a;">HÃƒÂ ng ngÃƒÂ n hÃ¡Â»Âc sinh Ã„â€˜ÃƒÂ£ hÃƒÂ nh Ã„â€˜Ã¡Â»â„¢ng</h2></div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:28px;">${[['2.840+','bÃƒÂ i test Ã„â€˜ÃƒÂ£ hoÃƒÂ n thÃƒÂ nh'],['94%','tÃ¡Â»Â± tin hÃ†Â¡n khi chÃ¡Â»Ân ngÃƒÂ nh'],['4.8/5 Ã¢Â­Â','Ã„â€˜ÃƒÂ¡nh giÃƒÂ¡ tÃ¡Â»Â« phÃ¡Â»Â¥ huynh']].map(([num,label])=>`<div style="text-align:center;"><div style="font-size:clamp(18px,4vw,24px);font-weight:900;color:#0f172a;">${num}</div><div style="font-size:11px;color:#6b7280;margin-top:4px;">${label}</div></div>`).join('')}</div>
    ${[['PhÃ¡Â»Â¥ huynh em Thanh HÃƒÂ ','HÃƒÂ  NÃ¡Â»â„¢i','Con Ã„â€˜Ã¡Â»Âc xong bÃ¡Â»Â ngay ÃƒÂ½ Ã„â€˜Ã¡Â»â€¹nh thi Kinh tÃ¡ÂºÂ¿ vÃƒÂ¬ biÃ¡ÂºÂ¿t mÃƒÂ¬nh thuÃ¡Â»â„¢c nhÃƒÂ³m sÃƒÂ¡ng tÃ¡ÂºÂ¡o. GiÃ¡Â»Â con Ã„â€˜ang hÃ¡Â»Âc TruyÃ¡Â»Ân thÃƒÂ´ng vÃƒÂ  rÃ¡ÂºÂ¥t hÃ¡ÂºÂ¡nh phÃƒÂºc.'],['Em Ã„ÂÃ¡Â»Â©c Minh','LÃ¡Â»â€ºp 11, TP.HCM','Em cÃ¡Â»Â© nghÃ„Â© mÃƒÂ¬nh phÃ¡ÂºÂ£i thi Y vÃƒÂ¬ ba mÃ¡ÂºÂ¹ muÃ¡Â»â€˜n. BÃƒÂ¡o cÃƒÂ¡o chÃ¡Â»â€° ra em thuÃ¡Â»â„¢c nhÃƒÂ³m NghiÃƒÂªn cÃ¡Â»Â©u-NghÃ¡Â»â€¡ thuÃ¡ÂºÂ­t. Em Ã„â€˜ÃƒÂ£ nÃƒÂ³i chuyÃ¡Â»â€¡n lÃ¡ÂºÂ¡i vÃ¡Â»â€ºi ba mÃ¡ÂºÂ¹.'],['PhÃ¡Â»Â¥ huynh em KhÃƒÂ¡nh Linh','HÃƒÂ  Giang','ChÃ¡Â»â€° hÃ†Â¡n 500k mÃƒÂ  trÃƒÂ¡nh Ã„â€˜Ã†Â°Ã¡Â»Â£c 4 nÃ„Æ’m hÃ¡Â»Âc sai ngÃƒÂ nh. Ã„ÂÃƒÂ¡ng lÃ¡ÂºÂ¯m. ChÃƒÂºng tÃƒÂ´i Ã„â€˜ÃƒÂ£ mua cho cÃ¡ÂºÂ£ 2 con.']].map(([name,loc,text])=>`<div style="padding:18px;border-radius:16px;background:#fff;border:1px solid #e2e8f0;margin-bottom:12px;"><div style="display:flex;gap:2px;margin-bottom:10px;">${'Ã¢Â­Â'.repeat(5)}</div><p style="font-size:14px;color:#374151;line-height:1.6;margin-bottom:12px;">"${text}"</p><p style="font-size:12px;font-weight:700;color:#0f172a;margin:0;">${name}</p><p style="font-size:11px;color:#9ca3af;margin:2px 0 0;">${loc}</p></div>`).join('')}
  </div>
</div>

<!-- REPORT CONTENTS -->
<div class="ncn-section" style="background:#fff;">
  <div class="ncn-cont">
    <div style="text-align:center;"><span class="ncn-badge" style="background:rgba(232,168,56,0.1);color:#E8A838;border:1px solid rgba(232,168,56,0.3);">BÃƒÂO CÃƒÂO Ã„ÂÃ¡ÂºÂ¦Y Ã„ÂÃ¡Â»Â¦ BAO GÃ¡Â»â€™M</span><h2 class="ncn-h2" style="color:#0f172a;">ToÃƒÂ n bÃ¡Â»â„¢ bÃ¡ÂºÂ£n Ã„â€˜Ã¡Â»â€œ sÃ¡Â»Â± nghiÃ¡Â»â€¡p Ã¢â‚¬â€ cÃƒÂ¡ nhÃƒÂ¢n hÃƒÂ³a cho bÃ¡ÂºÂ¡n</h2></div>
    <div style="border-radius:18px;overflow:hidden;border:1px solid #e2e8f0;">${['5 nghÃ¡Â»Â phÃƒÂ¹ hÃ¡Â»Â£p nhÃ¡ÂºÂ¥t Ã¢â‚¬â€ phÃƒÂ¢n tÃƒÂ­ch chi tiÃ¡ÂºÂ¿t tÃ¡Â»Â«ng nghÃ¡Â»Â','3 nghÃ¡Â»Â nÃƒÂªn trÃƒÂ¡nh Ã¢â‚¬â€ vÃƒÂ  lÃƒÂ½ do cÃ¡Â»Â¥ thÃ¡Â»Æ’','MÃƒÂ´i trÃ†Â°Ã¡Â»Âng lÃƒÂ m viÃ¡Â»â€¡c tÃ¡Â»â€˜i Ã†Â°u cho tÃƒÂ­nh cÃƒÂ¡ch cÃ¡Â»Â§a bÃ¡ÂºÂ¡n','LÃ¡Â»â„¢ trÃƒÂ¬nh: ngÃƒÂ nh hÃ¡Â»Âc Ã¢â€ â€™ nghÃ¡Â»Â nghiÃ¡Â»â€¡p Ã¢â€ â€™ mÃ¡Â»Â©c thu nhÃ¡ÂºÂ­p','ChiÃ¡ÂºÂ¿n lÃ†Â°Ã¡Â»Â£c phÃƒÂ¡t triÃ¡Â»Æ’n sÃ¡Â»Â± nghiÃ¡Â»â€¡p 5 nÃ„Æ’m tÃ¡Â»â€ºi'].map((item,i)=>`<div style="display:flex;align-items:center;gap:12px;padding:16px 20px;${i<4?'border-bottom:1px solid #f1f5f9;':''}"><span style="color:#2BA88C;font-size:16px;flex-shrink:0;">Ã¢Å“â€œ</span><span style="font-size:14px;color:#374151;">${item}</span></div>`).join('')}</div>
  </div>
</div>

<!-- CTA -->
<div style="background:linear-gradient(135deg,#1B2A4A 0%,#2d4a7a 100%);padding:56px 20px;">
  <div style="max-width:560px;margin:0 auto;text-align:center;">
    <div style="display:inline-flex;align-items:center;gap:10px;padding:10px 18px;border-radius:12px;background:rgba(232,168,56,0.12);border:1px solid rgba(232,168,56,0.3);margin-bottom:24px;">
      <span style="font-size:11px;font-weight:700;color:#E8A838;text-transform:uppercase;">Ã¢Å¡Â¡ Ã†Â¯U Ã„ÂÃƒÆ’I HÃ¡ÂºÂ¾T HÃ¡ÂºÂ N TRONG</span>
      <span id="ncn-countdown" style="font-family:monospace;font-size:18px;font-weight:900;color:#fff;">00:00:00</span>
    </div>
    <div style="margin-bottom:20px;">
      <div style="display:inline-block;padding:4px 14px;border-radius:999px;background:rgba(43,168,140,0.15);border:1px solid rgba(43,168,140,0.3);margin-bottom:12px;"><span style="font-size:12px;font-weight:700;color:#2BA88C;">TiÃ¡ÂºÂ¿t kiÃ¡Â»â€¡m 790.000Ã„â€˜</span></div>
      <div style="display:flex;align-items:baseline;justify-content:center;gap:12px;"><span style="text-decoration:line-through;color:rgba(255,255,255,0.4);font-size:16px;">${PRICE_ORIGINAL_DISPLAY}</span><span style="font-size:clamp(32px,7vw,44px);font-weight:900;color:#E8A838;">${PRICE_DISPLAY}</span></div>${IS_CAMPAIGN ? '<div style="margin-top:8px;text-align:center;"><span style="font-size:12px;font-weight:700;background:rgba(239,68,68,0.15);color:#f87171;border:1px solid rgba(239,68,68,0.3);padding:4px 12px;border-radius:20px;display:inline-block;">Ã°Å¸â€Â¥ Ã†Â¯u Ã„â€˜ÃƒÂ£i chiÃ¡ÂºÂ¿n dÃ¡Â»â€¹ch Ã‚Â· KÃ¡ÂºÂ¿t thÃƒÂºc 28/7/2026</span></div>' : ''}
      <p style="font-size:14px;color:rgba(255,255,255,0.6);max-width:400px;margin:12px auto 0;">ChÃ¡Â»â€° hÃ†Â¡n 500k Ã„â€˜Ã¡Â»Æ’ trÃƒÂ¡nh quyÃ¡ÂºÂ¿t Ã„â€˜Ã¡Â»â€¹nh sai cÃƒÂ³ thÃ¡Â»Æ’ khiÃ¡ÂºÂ¿n bÃ¡ÂºÂ¡n mÃ¡ÂºÂ¥t 4 nÃ„Æ’m Ã„â€˜Ã¡ÂºÂ¡i hÃ¡Â»Âc vÃƒÂ  hÃƒÂ ng trÃ„Æ’m triÃ¡Â»â€¡u Ã„â€˜Ã¡Â»â€œng.</p>
    </div>
    <button class="ncn-cta-btn" id="ncn-main-cta">XEM NGAY 5 NGHÃ¡Â»â‚¬ PHÃƒâ„¢ HÃ¡Â»Â¢P NHÃ¡ÂºÂ¤T VÃ¡Â»Å¡I BÃ¡ÂºÂ N<br><span style="font-size:12px;font-weight:600;opacity:0.8;">& Ã„ÂÃ¡Â»Å NH HÃ†Â¯Ã¡Â»Å¡NG PHÃƒÂT TRIÃ¡Â»â€šN TRONG TÃ†Â¯Ã†Â NG LAI</span></button>
    <p style="font-size:11px;color:rgba(255,255,255,0.35);margin-top:12px;">NhÃ¡ÂºÂ­n file PDF trong 30 giÃƒÂ¢y Ã‚Â· Thanh toÃƒÂ¡n bÃ¡ÂºÂ£o mÃ¡ÂºÂ­t</p>
    <p style="font-size:14px;font-weight:700;color:#E8A838;margin-top:16px;">Ã¢Å¡Â¡ Ã„ÂÃ¡Â»Â«ng bÃ¡Â»Â lÃ¡Â»Â¡ tÃ†Â°Ã†Â¡ng lai chÃ¡Â»â€° vÃƒÂ¬ sÃ¡Â»Â± chÃ¡ÂºÂ§n chÃ¡Â»Â« cÃ¡Â»Â§a hÃƒÂ´m nay.</p>
  </div>
</div>
<div style="background:#1B2A4A;padding:20px;text-align:center;"><p style="color:rgba(255,255,255,0.25);font-size:12px;margin:0;">Ã‚Â© NCN Academy Ã¢â‚¬â€ NghÃ¡Â»Â ChÃ¡Â»Ân NgÃ†Â°Ã¡Â»Âi</p></div>`;

    document.getElementById('ncn-main-cta').onclick = () => openCheckout(payload);
    window._ncnOpenCheckout = () => openCheckout(payload);
    startCountdown();
    fetchAiData(payload).then(ai => { renderInsights(ai); renderCareers(ai); renderRisk(ai); });
  }

  function renderInsights(ai) {
    const area = document.getElementById('ncn-insights-area'); if (!area) return;
    const ins = ai && ai.insights;
    area.innerHTML = [['Ã°Å¸ÂªÅ¾', ins && ins.insight_1], ['Ã°Å¸Â§Â­', ins && ins.insight_2], ['Ã°Å¸â€™Â¡', ins && ins.insight_3]].filter(([,t]) => t).map(([icon,text]) => `<div style="display:flex;gap:14px;padding:18px;border-radius:16px;background:#fffbf0;border:1px solid #f0e6d0;margin-bottom:12px;"><span style="font-size:24px;flex-shrink:0;">${icon}</span><p style="font-size:14px;line-height:1.6;color:#374151;margin:0;">${text}</p></div>`).join('') || '<p style="color:#94a3b8;text-align:center;font-size:13px;">Ã„Âang phÃƒÂ¢n tÃƒÂ­ch...</p>';
  }

  function renderCareers(ai) {
    const area = document.getElementById('ncn-careers-area'); if (!area) return;
    const careers = ai && ai.careers && ai.careers.top_careers;
    if (!careers || !careers.length) { area.innerHTML = '<p style="color:#94a3b8;font-size:13px;text-align:center;">Ã„Âang tÃ¡ÂºÂ£i...</p>'; return; }
    area.innerHTML = careers.map(c => c.locked
      ? `<div class="ncn-career" style="opacity:.7;background:#f1f5f9;border-style:dashed;cursor:pointer;" onclick="window._ncnOpenCheckout&&window._ncnOpenCheckout()"><div class="ncn-star" style="background:#cbd5e1;">${c.rank}</div><div style="flex:1;"><div style="display:flex;align-items:center;gap:6px;"><span>Ã°Å¸â€â€™</span><span style="font-size:13px;font-weight:700;color:#94a3b8;">NghÃ¡Â»Â phÃƒÂ¹ hÃ¡Â»Â£p #${c.rank} Ã¢â‚¬â€ phÃƒÂ¹ hÃ¡Â»Â£p hÃ†Â¡n cÃ¡ÂºÂ£ 3 nghÃ¡Â»Â bÃƒÂªn dÃ†Â°Ã¡Â»â€ºi</span></div><p style="font-size:11px;color:#94a3b8;margin:3px 0 0;">MÃ¡Â»Å¸ khÃƒÂ³a trong bÃƒÂ¡o cÃƒÂ¡o Ã„â€˜Ã¡ÂºÂ§y Ã„â€˜Ã¡Â»Â§</p></div><div style="text-align:right;flex-shrink:0;"><div style="font-weight:900;color:#94a3b8;">${c.match}%</div><div style="font-size:10px;color:#cbd5e1;">phÃƒÂ¹ hÃ¡Â»Â£p</div></div></div>`
      : `<div class="ncn-career"><div class="ncn-star" style="background:#2BA88C;">${c.rank}</div><div style="flex:1;"><p style="font-size:14px;font-weight:700;color:#0f172a;margin:0 0 3px;">${c.title}</p><p style="font-size:12px;color:#6b7280;margin:0;">${c.reason}</p></div><div style="text-align:right;flex-shrink:0;"><div style="font-size:14px;font-weight:900;color:#2BA88C;">${c.match}%</div><div style="font-size:11px;color:#9ca3af;">phÃƒÂ¹ hÃ¡Â»Â£p</div></div></div>`
    ).join('');
  }

  function renderRisk(ai) {
    const area = document.getElementById('ncn-risk-area'); if (!area) return;
    const risk = ai && ai.risk;
    area.innerHTML = `<div style="font-size:56px;font-weight:900;color:#E8A838;margin-bottom:12px;">${(risk && risk.risk_percent) || 73}%</div><p style="font-size:14px;color:rgba(255,255,255,0.65);max-width:380px;margin:0 auto;">${(risk && risk.risk_description) || 'NgÃ†Â°Ã¡Â»Âi cÃƒÂ³ kÃ¡ÂºÂ¿t quÃ¡ÂºÂ£ giÃ¡Â»â€˜ng bÃ¡ÂºÂ¡n thÃ†Â°Ã¡Â»Âng chÃ¡Â»Ân sai ngÃƒÂ nh vÃƒÂ¬ bÃ¡Â»â€¹ Ã¡ÂºÂ£nh hÃ†Â°Ã¡Â»Å¸ng bÃ¡Â»Å¸i ÃƒÂ¡p lÃ¡Â»Â±c gia Ã„â€˜ÃƒÂ¬nh thay vÃƒÂ¬ lÃ¡ÂºÂ¯ng nghe bÃ¡ÂºÂ£n thÃƒÂ¢n.'}</p>`;
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


