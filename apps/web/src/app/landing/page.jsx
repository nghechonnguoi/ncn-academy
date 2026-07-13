"use client";
import React, { useState } from "react";

const QUIZ_URL = "https://quiz.nghechonnguoi.com";
const REPORT_PRICE = "568.000đ";

function FadeIn({ children, className = "" }) {
  const ref = React.useRef(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(24px)",
      transition: "opacity 0.7s ease, transform 0.7s ease",
    }}>
      {children}
    </div>
  );
}

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      q: "Có phù hợp cho học sinh lớp 10, 11, 12 không?",
      a: "Rất phù hợp. Đặc biệt lớp 10–11 là thời điểm vàng — còn đủ thời gian để tìm hiểu và chuẩn bị. Lớp 12 vẫn làm được nhưng nên càng sớm càng tốt."
    },
    {
      q: "Sinh viên đã vào đại học có dùng được không?",
      a: "Được. Nhiều sinh viên năm 1–2 nhận ra mình chọn sai ngành. Báo cáo giúp bạn hiểu rõ hơn bản thân để có quyết định tiếp theo đúng đắn hơn — dù là tiếp tục hay chuyển hướng."
    },
    {
      q: "Bao lâu nhận được báo cáo?",
      a: "Sau khi hoàn thành bài trắc nghiệm và thanh toán, báo cáo được tạo trong vòng vài phút và gửi qua email ngay lập tức."
    },
    {
      q: "Phụ huynh có đọc được báo cáo không?",
      a: "Có — và rất nên đọc cùng con. Báo cáo được viết để cả gia đình cùng hiểu, cùng bàn. Vì chọn nghề không phải việc của riêng con."
    },
    {
      q: "Báo cáo có thay thế quyết định của gia đình không?",
      a: "Không. Báo cáo không nói con 'phải' làm gì. Nó cung cấp thêm cơ sở, dữ liệu, góc nhìn — để cả nhà có nền tảng thảo luận, thay vì chỉ dựa vào cảm tính."
    },
  ];

  return (
    <div className="page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .page { font-family: 'Inter', system-ui, sans-serif; color: #1a1a2e; overflow-x: hidden; }

        /* ===== TOKENS ===== */
        :root {
          --bg-dark: #0e0e1a;
          --bg-warm: #faf8f5;
          --bg-white: #ffffff;
          --accent: #e8654a;
          --accent-dark: #d4573f;
          --red: #c0392b;
          --green: #2ecc71;
          --purple: #6366f1;
          --text: #1a1a2e;
          --text-light: #555;
          --text-muted: #888;
          --serif: 'Lora', serif;
          --sans: 'Inter', system-ui, sans-serif;
        }

        /* ===== HERO ===== */
        .hero {
          min-height: 100vh;
          background: var(--bg-dark);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          text-align: center;
          padding: 56px 24px 72px;
          position: relative; overflow: hidden;
        }
        .hero::before {
          content: ''; position: absolute;
          top: -200px; right: -200px;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(232,101,74,0.06) 0%, transparent 70%);
          pointer-events: none;
        }
        .hero-pre {
          font-family: var(--serif);
          color: rgba(255,255,255,0.5);
          font-size: 16px; font-style: italic;
          margin-bottom: 20px; line-height: 1.6;
        }
        .hero h1 {
          font-family: var(--serif);
          color: #fff;
          font-size: clamp(28px, 5.5vw, 48px);
          line-height: 1.3;
          max-width: 720px;
          margin-bottom: 28px;
          font-weight: 700;
        }
        .hero h1 .hl { color: var(--accent); font-style: italic; }
        .hero-quote {
          background: rgba(255,255,255,0.06);
          border-left: 3px solid var(--accent);
          padding: 20px 28px;
          max-width: 560px;
          text-align: left;
          border-radius: 0 12px 12px 0;
          margin-bottom: 36px;
        }
        .hero-quote p {
          font-family: var(--serif);
          color: rgba(255,255,255,0.7);
          font-size: 16px; line-height: 1.8;
          font-style: italic;
        }
        .hero-desc {
          color: rgba(255,255,255,0.45);
          font-size: 14px; max-width: 520px;
          line-height: 1.7; margin-bottom: 40px;
        }
        .cta-main {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--accent); color: #fff;
          font-size: 16px; font-weight: 700;
          padding: 16px 40px; border-radius: 12px;
          border: none; cursor: pointer; text-decoration: none;
          box-shadow: 0 8px 32px rgba(232,101,74,0.35);
          transition: all 0.3s;
        }
        .cta-main:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 44px rgba(232,101,74,0.5);
          background: var(--accent-dark);
        }
        .cta-ghost {
          display: inline-flex; align-items: center; gap: 6px;
          color: rgba(255,255,255,0.5);
          font-size: 14px; font-weight: 500;
          padding: 12px 24px;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          text-decoration: none;
          transition: all 0.3s;
          margin-left: 12px;
        }
        .cta-ghost:hover { border-color: rgba(255,255,255,0.3); color: rgba(255,255,255,0.8); }
        .cta-sub { color: rgba(255,255,255,0.3); font-size: 12px; margin-top: 16px; }
        .cta-row { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; align-items: center; }

        /* ===== SECTIONS ===== */
        .section { padding: 80px 24px; }
        .section-sm { padding: 64px 24px; }
        .container { max-width: 680px; margin: 0 auto; }
        .narrow { max-width: 600px; margin: 0 auto; }
        .wide { max-width: 900px; margin: 0 auto; }

        .sec-label {
          font-size: 11px; font-weight: 700;
          letter-spacing: 2px; text-transform: uppercase;
          margin-bottom: 14px;
        }
        .sec-title {
          font-family: var(--serif);
          font-size: clamp(24px, 4vw, 38px);
          line-height: 1.3;
          margin-bottom: 16px;
        }

        /* ===== LETTER PROSE ===== */
        .prose {
          font-family: var(--serif);
          font-size: 17px; line-height: 2.1;
          color: #2a2a2a;
        }
        .prose p { margin-bottom: 22px; }
        .prose .em { color: var(--red); font-weight: 700; font-style: italic; }
        .prose .big {
          font-size: 21px; font-weight: 700;
          color: var(--text); margin: 38px 0 18px; line-height: 1.4;
        }
        .prose .quiet { color: var(--text-muted); font-size: 15px; }
        .prose-hr {
          width: 50px; height: 3px;
          background: var(--accent); margin: 42px 0; border: none;
        }

        /* ===== FEAR GRID ===== */
        .fear-section { background: var(--bg-dark); color: #fff; }
        .fear-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
        @media (max-width: 640px) { .fear-grid { grid-template-columns: 1fr; } }
        .fear-col h3 {
          font-family: var(--serif);
          font-size: 18px; font-weight: 700;
          margin-bottom: 20px; color: #fff;
        }
        .fear-item {
          display: flex; align-items: flex-start; gap: 12px;
          margin-bottom: 16px;
        }
        .fear-dot {
          width: 6px; min-width: 6px; height: 6px;
          border-radius: 50%; background: var(--accent);
          margin-top: 8px;
        }
        .fear-item p {
          font-size: 15px; color: rgba(255,255,255,0.6);
          line-height: 1.65;
        }

        /* ===== COST SECTION ===== */
        .cost-chain {
          display: flex; flex-direction: column;
          align-items: center; gap: 0;
          margin: 40px 0;
        }
        .cost-link {
          text-align: center; padding: 16px 0;
          position: relative;
        }
        .cost-link::after {
          content: '↓'; display: block;
          color: #ccc; font-size: 18px;
          margin-top: 8px;
        }
        .cost-link:last-child::after { display: none; }
        .cost-link p {
          font-family: var(--serif);
          font-size: 16px; color: var(--text-light);
          line-height: 1.5;
        }
        .cost-link .num {
          font-family: var(--serif);
          font-size: 14px; font-weight: 700;
          color: var(--red);
          display: block; margin-bottom: 4px;
        }
        .cost-bottom {
          display: grid; grid-template-columns: 1fr 1fr 1fr;
          gap: 16px; margin-top: 40px;
        }
        @media (max-width: 640px) { .cost-bottom { grid-template-columns: 1fr; } }
        .cost-card {
          text-align: center; padding: 28px 16px;
          border-radius: 14px; background: var(--bg-warm);
          border: 1px solid #eee;
        }
        .cost-card .num {
          font-family: var(--serif);
          font-size: 32px; font-weight: 700;
          color: var(--red); margin-bottom: 8px;
        }
        .cost-card .lab {
          font-family: var(--serif);
          font-size: 16px; font-weight: 600;
          color: var(--text); line-height: 1.5;
        }

        /* ===== VISION SECTION ===== */
        .vision-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px; margin-top: 32px;
        }
        .vision-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px; padding: 28px 24px;
        }
        .vision-card h4 {
          font-family: var(--serif);
          font-size: 16px; font-weight: 700;
          margin-bottom: 10px; color: #fff;
        }
        .vision-card p { font-size: 14px; color: rgba(255,255,255,0.5); line-height: 1.7; }

        /* ===== CHECK LISTS ===== */
        .check-list { list-style: none; }
        .check-list li {
          display: flex; align-items: flex-start; gap: 12px;
          margin-bottom: 14px;
          font-size: 15px; line-height: 1.6;
        }
        .check-icon { flex-shrink: 0; margin-top: 2px; font-size: 16px; }

        /* ===== COMPARE TABLE ===== */
        .compare-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 640px) { .compare-grid { grid-template-columns: 1fr; } }
        .compare-col {
          border-radius: 16px; padding: 32px 28px;
        }
        .compare-col.bad { background: #fef2f2; border: 1px solid #fecaca; }
        .compare-col.good { background: #f0fdf4; border: 1px solid #bbf7d0; }
        .compare-col h3 {
          font-family: var(--serif);
          font-size: 18px; font-weight: 700;
          margin-bottom: 20px;
        }
        .compare-col.bad h3 { color: var(--red); }
        .compare-col.good h3 { color: #16a34a; }
        .compare-item {
          display: flex; align-items: flex-start; gap: 10px;
          margin-bottom: 12px; font-size: 14px; line-height: 1.55;
          color: var(--text-light);
        }
        .compare-item .icon { flex-shrink: 0; font-size: 14px; margin-top: 2px; }

        /* ===== TESTIMONIALS ===== */
        .testi-grid {
          display: flex; flex-direction: column; gap: 20px;
        }
        .testi-card {
          border: 1px solid #eee; border-radius: 14px;
          padding: 28px 24px; background: var(--bg-warm);
        }
        .testi-quote {
          font-family: var(--serif);
          font-size: 15px; font-style: italic;
          line-height: 1.85; color: #333; margin-bottom: 16px;
        }
        .testi-name { font-weight: 700; font-size: 14px; }
        .testi-role { font-size: 12px; color: #999; }

        /* ===== PRICING ===== */
        .price-box {
          text-align: center;
          background: var(--bg-warm);
          border: 2px solid #eee;
          border-radius: 20px;
          padding: 48px 32px;
          max-width: 520px;
          margin: 40px auto 0;
        }
        .price-compare {
          display: flex; flex-direction: column; gap: 10px;
          margin-bottom: 32px; text-align: left;
        }
        .price-row {
          display: flex; justify-content: space-between;
          font-size: 14px; color: var(--text-light);
          padding-bottom: 10px;
          border-bottom: 1px solid #eee;
        }
        .price-row .val { font-weight: 600; color: var(--text); }
        .price-main {
          font-family: var(--serif);
          font-size: 48px; font-weight: 700;
          color: var(--accent); margin-bottom: 8px;
        }
        .price-note { font-size: 14px; color: var(--text-muted); margin-bottom: 28px; }

        /* ===== FAQ ===== */
        .faq-list { display: flex; flex-direction: column; gap: 10px; }
        .faq-item {
          border: 1px solid #e0ddd8; border-radius: 12px;
          overflow: hidden; background: #fff;
        }
        .faq-item.open { border-color: #ccc; }
        .faq-q {
          width: 100%; text-align: left; padding: 18px 22px;
          background: none; border: none; font-size: 15px;
          font-weight: 600; cursor: pointer;
          display: flex; justify-content: space-between;
          align-items: center; gap: 14px; color: var(--text);
          font-family: var(--sans);
        }
        .faq-arr { font-size: 14px; transition: transform 0.3s; flex-shrink: 0; color: #999; }
        .faq-item.open .faq-arr { transform: rotate(180deg); }
        .faq-a {
          padding: 0 22px 18px; font-size: 14px;
          color: #666; line-height: 1.75;
        }

        /* ===== FINAL CTA ===== */
        .final {
          background: var(--bg-dark);
          text-align: center; padding: 100px 24px;
          position: relative; overflow: hidden;
        }
        .final::before {
          content: ''; position: absolute;
          bottom: -150px; left: 50%;
          transform: translateX(-50%);
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(232,101,74,0.08) 0%, transparent 60%);
          pointer-events: none;
        }
        .final h2 {
          font-family: var(--serif); color: #fff;
          font-size: clamp(26px, 4.5vw, 44px);
          line-height: 1.3; max-width: 640px;
          margin: 0 auto 20px;
        }
        .final h2 .hl { color: var(--accent); font-style: italic; }
        .final .fsub {
          color: rgba(255,255,255,0.5); font-size: 16px;
          max-width: 500px; margin: 0 auto 40px; line-height: 1.8;
          font-family: var(--serif);
        }
        .footer {
          background: #0a0a14; color: rgba(255,255,255,0.25);
          text-align: center; padding: 24px 20px; font-size: 12px;
        }

        /* ===== REPORT ITEMS ===== */
        .report-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }
        .report-item {
          background: #fff;
          border: 1px solid #eee;
          border-radius: 14px;
          padding: 24px 20px;
          text-align: center;
        }
        .report-item .icon { font-size: 28px; margin-bottom: 10px; }
        .report-item h4 {
          font-family: var(--serif);
          font-size: 15px; font-weight: 700;
          margin-bottom: 6px; color: var(--text);
        }
        .report-item p { font-size: 13px; color: #888; line-height: 1.5; }

        @media (max-width: 600px) {
          .prose { font-size: 16px; line-height: 2; }
          .hero h1 { font-size: 26px; }
          .cta-row { flex-direction: column; }
          .cta-ghost { margin-left: 0; }
        }
      `}</style>

      {/* ============================================================
          SECTION 1: HERO
          ============================================================ */}
      <section className="hero">
        <p className="hero-pre">Dành cho phụ huynh và học sinh lớp 9–12</p>
        <h1>
          Điều bố mẹ lo nhất<br/>
          không phải con thi được bao nhiêu điểm...
        </h1>
        <div className="hero-quote">
          <p>
            "Sau 4 năm đại học, liệu con có tìm được công việc phù hợp, 
            tự lập được, và sống một cuộc đời bớt vất vả hơn bố mẹ?"
          </p>
        </div>
        <p className="hero-desc">
          Báo cáo Định vị Sự nghiệp giúp học sinh hiểu bản thân, hiểu thế mạnh 
          và có thêm cơ sở để lựa chọn hướng đi phù hợp — trước khi đưa ra 
          những quyết định quan trọng nhất cuộc đời.
        </p>
        <div className="cta-row">
          <a href={QUIZ_URL} className="cta-main" target="_blank" rel="noopener">
            Nhận báo cáo ngay →
          </a>
        </div>
        <p className="cta-sub">Bắt đầu bằng bài trắc nghiệm miễn phí · Kết quả tức thì</p>
      </section>

      {/* ============================================================
          SECTION 2: NỖI LO KHÔNG DỄ NÓI — BỨC THƯ
          ============================================================ */}
      <section className="section" style={{ background: "var(--bg-warm)" }}>
        <div className="container">
          <FadeIn>
            <div className="prose">
              <p className="big">Có bao giờ bố mẹ hỏi con <span className="em">"Sau này con muốn làm nghề gì?"</span> — rồi nhận lại sự im lặng không?</p>

              <p>Hoặc con trả lời cho có. Nói đại một ngành. Mà hỏi lại thì chính con cũng chẳng biết ngành đó làm gì.</p>

              <hr className="prose-hr" />

              <p>Hỏi nhẹ — con lắc đầu. Hỏi nghiêm — con cáu. Kể kinh nghiệm — con nghe mà mắt nhìn đi chỗ khác. Nhờ thầy cô — thầy nói chung chung vài câu rồi thôi.</p>
              <p><span className="em">Càng cố — con càng xa.</span></p>
              <p>Không phải con hư. Không phải con không thương ba mẹ. Mà con cũng đang sợ. Chỉ là không ai biết cách nói ra.</p>

              <hr className="prose-hr" />

              <p>Rồi đêm đến, con đi ngủ, anh chị nằm đó — nghĩ gì?</p>
              <p>Nghĩ: <span className="em">"Rồi nó sẽ ra sao?"</span></p>
              <p>Nhìn con nhà hàng xóm đã có định hướng rõ ràng — rồi quay lại nhìn con mình. Không phải so sánh. Nhưng nỗi lo nó không cần lý do — <span className="em">nó cứ tới.</span></p>
              <p><span className="em">"Mình có đang làm đủ cho con không?"</span></p>
              <p><span className="em">"Nếu con chọn sai — có phải tại mình?"</span></p>
              <p className="quiet">Những câu hỏi đó, anh chị không hỏi ai. Mà chỉ hỏi chính mình. Trong im lặng.</p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ============================================================
          SECTION 2B: NỖI SỢ CỤ THỂ — GRID
          ============================================================ */}
      <section className="section fear-section" style={{ background: "var(--bg-dark)", color: "#fff" }}>
        <div className="container">
          <FadeIn>
            <div className="sec-label" style={{ color: "var(--accent)" }}>Nỗi lo không dễ nói thành lời</div>
            <div className="fear-grid">
              <div className="fear-col">
                <h3>Với học sinh</h3>
                {[
                  "Không biết mình thực sự phù hợp nghề gì.",
                  "Sợ chọn sai ngành rồi hối hận.",
                  "Sợ học xong 4 năm mà thất nghiệp.",
                  "Sợ công nghệ và AI thay thế công việc tương lai.",
                  "Sợ ra trường không kiếm được tiền nuôi bản thân.",
                  "Sợ mất 4 năm đẹp nhất tuổi trẻ cho ngành không yêu.",
                ].map((t, i) => (
                  <div className="fear-item" key={i}>
                    <div className="fear-dot" />
                    <p>{t}</p>
                  </div>
                ))}
              </div>
              <div className="fear-col">
                <h3>Với phụ huynh</h3>
                {[
                  "Sợ con chọn sai đường, đi vòng mấy năm trời.",
                  "Sợ con ra trường rồi chật vật mưu sinh.",
                  "Sợ con học xong mà không xin được việc.",
                  "Sợ đầu tư hàng trăm triệu nhưng kết quả không như mong muốn.",
                  "Sợ con phải đi lại đúng những vất vả mà mình đã trải qua.",
                ].map((t, i) => (
                  <div className="fear-item" key={i}>
                    <div className="fear-dot" />
                    <p>{t}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ============================================================
          SECTION 3: CÁI GIÁ CỦA VIỆC CHỌN SAI
          ============================================================ */}
      <section className="section" style={{ background: "var(--bg-white)" }}>
        <div className="container">
          <FadeIn>
            <div className="sec-title" style={{ textAlign: "center" }}>
              Điều đáng sợ nhất không phải là trượt đại học.
            </div>
            <p style={{ textAlign: "center", fontFamily: "var(--serif)", fontSize: 18, color: "var(--red)", fontWeight: 700, marginBottom: 8, fontStyle: "italic" }}>
              Mà là đỗ vào ngành không phù hợp.
            </p>
          </FadeIn>
          <FadeIn>
            <div className="cost-chain">
              {[
                "Đỗ vào ngành không phù hợp",
                "Học trong chán nản, mất dần động lực",
                "Ra trường làm trái ngành hoặc thất nghiệp",
                "Liên tục nhảy việc, không phát huy được năng lực",
                "Nhiều năm loay hoay tìm lại hướng đi",
              ].map((t, i) => (
                <div className="cost-link" key={i}><p>{t}</p></div>
              ))}
            </div>
          </FadeIn>
          <FadeIn>
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <p style={{ fontFamily: "var(--serif)", fontSize: 17, color: "var(--text)", lineHeight: 1.6 }}>
                Một quyết định sai ở tuổi 18 có thể khiến con mất:
              </p>
            </div>
            <div className="cost-bottom">
              <div className="cost-card">
                <div className="num">4 năm</div>
                <div className="lab">thanh xuân đẹp nhất</div>
              </div>
              <div className="cost-card">
                <div className="num">Trăm triệu</div>
                <div className="lab">học phí đổ sông<br/>đổ biển</div>
              </div>
              <div className="cost-card">
                <div className="num">Nhiều năm</div>
                <div className="lab">loay hoay tìm lại<br/>hướng đi</div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ============================================================
          SECTION 4: NHÌN THẤY TƯƠNG LAI
          ============================================================ */}
      <section className="section" style={{ background: "var(--bg-warm)" }}>
        <div className="container">
          <FadeIn>
            <div className="sec-label" style={{ color: "var(--green)" }}>Hình dung một tương lai khác</div>
            <div className="sec-title">Nếu con hiểu bản thân từ sớm thì sao?</div>
            <div className="prose" style={{ marginTop: 20 }}>
              <p>Thử tưởng tượng: con bạn bước vào phòng và nói —</p>
              <p><span className="em">"Ba mẹ ơi, con đã biết mình mạnh ở đâu. Con biết mình phù hợp kiểu công việc nào. Và con muốn tìm hiểu thêm về ngành này."</span></p>
              <p>Anh chị sẽ cảm thấy sao?</p>
              <p className="quiet">Nhẹ lòng. Yên tâm. Và tự hào — vì con đang bắt đầu lớn thật rồi.</p>
            </div>
          </FadeIn>
          <FadeIn>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, marginTop: 40 }}>
              <div>
                <h3 style={{ fontFamily: "var(--serif)", fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Con biết:</h3>
                <ul className="check-list">
                  {[
                    "Mình mạnh ở đâu.",
                    "Mình có tố chất gì.",
                    "Mình phù hợp môi trường nào.",
                    "Mình nên phát triển theo hướng nào.",
                    "Nhóm nghề nào phát huy tốt nhất năng lực của mình."
                  ].map((t, i) => (
                    <li key={i}><span className="check-icon" style={{ color: "var(--green)" }}>✓</span>{t}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 style={{ fontFamily: "var(--serif)", fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Bố mẹ yên tâm hơn vì:</h3>
                <ul className="check-list">
                  {[
                    "Không còn phải đoán mò.",
                    "Không còn chọn theo cảm tính.",
                    "Có thêm cơ sở để đồng hành cùng con.",
                    "Cả nhà cùng nhìn về một hướng."
                  ].map((t, i) => (
                    <li key={i}><span className="check-icon" style={{ color: "var(--green)" }}>✓</span>{t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ============================================================
          SECTION 5: MÂU THUẪN GIA ĐÌNH
          ============================================================ */}
      <section className="section" style={{ background: "var(--bg-white)" }}>
        <div className="container">
          <FadeIn>
            <div className="sec-title">
              Khi cả nhà đều muốn điều tốt nhất cho con — nhưng không tìm được tiếng nói chung
            </div>
            <div className="prose" style={{ marginTop: 20 }}>
              <p>Con thích một ngành. Bố muốn một ngành khác. Mẹ lại lo lắng theo cách riêng.</p>
              <p>Ai cũng yêu thương. Ai cũng muốn điều tốt nhất.</p>
              <p>Nhưng cuối cùng — là tranh luận. Là im lặng. Là bữa cơm nặng nề.</p>

              <hr className="prose-hr" />

              <p className="big">Điều gia đình cần không phải là thêm một ý kiến.</p>
              <p><span className="em">Mà là một cơ sở để cùng nhìn về một hướng.</span></p>

              <p>Sau khi có báo cáo:</p>
            </div>
          </FadeIn>
          <FadeIn>
            <ul className="check-list" style={{ marginTop: 8, maxWidth: 480 }}>
              {[
                "Cả nhà có thể ngồi lại với nhau.",
                "Có dữ liệu để trao đổi, không chỉ cảm tính.",
                "Có căn cứ để thảo luận.",
                "Giảm tranh cãi. Tăng thấu hiểu.",
                "Ba mẹ và con — lần đầu nói cùng một ngôn ngữ về tương lai."
              ].map((t, i) => (
                <li key={i}><span className="check-icon" style={{ color: "var(--green)" }}>✓</span>{t}</li>
              ))}
            </ul>
          </FadeIn>
        </div>
      </section>

      {/* ============================================================
          SECTION 6: BÁO CÁO GIÚP GÌ?
          ============================================================ */}
      <section className="section" style={{ background: "var(--bg-warm)" }}>
        <div className="wide" style={{ maxWidth: 800, margin: "0 auto" }}>
          <FadeIn>
            <div className="sec-label" style={{ color: "var(--purple)", textAlign: "center" }}>Sau báo cáo, con nhận được gì?</div>
            <div className="sec-title" style={{ textAlign: "center" }}>
              Một bản đồ rõ ràng — để con không phải đi trong sương mù
            </div>
          </FadeIn>
          <FadeIn>
            <div className="report-grid" style={{ marginTop: 36 }}>
              {[
                { icon: "🧭", title: "Bản đồ năng lực cá nhân", desc: "Hiểu mình mạnh ở đâu, yếu chỗ nào" },
                { icon: "💡", title: "Điểm mạnh nổi bật", desc: "Những tố chất tự nhiên cần phát huy" },
                { icon: "🔧", title: "Điểm cần phát triển", desc: "Những kỹ năng nên rèn luyện thêm" },
                { icon: "🌱", title: "Môi trường phù hợp", desc: "Kiểu công việc và môi trường con sẽ phát huy tốt nhất" },
                { icon: "🎯", title: "5 nghề phù hợp", desc: "Gợi ý nghề nghiệp cụ thể, không chung chung" },
                { icon: "🗺️", title: "Lộ trình phát triển", desc: "Bước đi cụ thể từ bây giờ đến tương lai" },
              ].map((item, i) => (
                <div className="report-item" key={i}>
                  <div className="icon">{item.icon}</div>
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ============================================================
          SECTION 7: SO SÁNH HAI TƯƠNG LAI
          ============================================================ */}
      <section className="section" style={{ background: "var(--bg-white)" }}>
        <div className="container">
          <FadeIn>
            <div className="sec-title" style={{ textAlign: "center", marginBottom: 32 }}>
              Hai con đường. Một lựa chọn.
            </div>
          </FadeIn>
          <FadeIn>
            <div className="compare-grid">
              <div className="compare-col bad">
                <h3>❌ Không có định hướng</h3>
                {[
                  "Chọn theo cảm tính, theo bạn bè, theo xu hướng.",
                  "Dễ chọn sai ngành.",
                  "Dễ mất động lực giữa chừng.",
                  "Ra trường làm trái ngành hoặc thất nghiệp.",
                  "Nhiều năm loay hoay, hối hận.",
                ].map((t, i) => (
                  <div className="compare-item" key={i}>
                    <span className="icon">✗</span><span>{t}</span>
                  </div>
                ))}
              </div>
              <div className="compare-col good">
                <h3>✅ Có Định vị Sự nghiệp</h3>
                {[
                  "Hiểu bản thân, hiểu thế mạnh, hiểu môi trường.",
                  "Tự tin hơn khi chọn nghề.",
                  "Có định hướng rõ ràng, có động lực.",
                  "Giảm rủi ro chọn sai.",
                  "Có lộ trình phát triển sớm hơn bạn bè.",
                ].map((t, i) => (
                  <div className="compare-item" key={i}>
                    <span className="icon">✓</span><span>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ============================================================
          SECTION 8: SOCIAL PROOF
          ============================================================ */}
      <section className="section" style={{ background: "var(--bg-warm)" }}>
        <div className="container">
          <FadeIn>
            <div className="sec-label" style={{ color: "var(--purple)" }}>Câu chuyện thật</div>
            <div className="sec-title" style={{ marginBottom: 32 }}>
              Những gia đình đã tìm thấy hướng đi rõ ràng hơn
            </div>
          </FadeIn>
          <div className="testi-grid">
            <FadeIn>
              <div className="testi-card">
                <p className="testi-quote">
                  "Trước giờ mỗi lần hỏi con muốn học gì, cháu cứ im. Tôi tưởng cháu lười suy nghĩ. 
                  Đọc báo cáo xong mới hiểu — cháu không lười, cháu không biết bắt đầu từ đâu. 
                  Giờ hai mẹ con ngồi nói chuyện được rồi. Nhẹ cả người."
                </p>
                <div className="testi-name">Chị Hồng</div>
                <div className="testi-role">Phụ huynh · Hà Nội</div>
              </div>
            </FadeIn>
            <FadeIn>
              <div className="testi-card">
                <p className="testi-quote">
                  "Ở quê tôi ai cũng bảo con gái học Sư phạm cho chắc. 
                  Nhưng con bé nhà tôi nó không hợp kiểu đó. Đọc báo cáo xong, 
                  tôi mới thấy con bé có tố chất khác hẳn. Giờ cháu đang tìm hiểu ngành 
                  Truyền thông — mà tự tin lắm, không như trước."
                </p>
                <div className="testi-name">Anh Tuấn</div>
                <div className="testi-role">Phụ huynh · Thanh Hóa</div>
              </div>
            </FadeIn>
            <FadeIn>
              <div className="testi-card">
                <p className="testi-quote">
                  "Bạn bè nộp Kinh tế hết nên mình cũng định nộp theo. 
                  Làm xong bài trắc nghiệm mới biết mình hợp với nhóm nghề khác. 
                  Lúc đầu hơi bất ngờ, nhưng đọc kỹ thì đúng thật. 
                  Ít nhất giờ mình có cái gì đó rõ ràng để suy nghĩ, không phải chọn đại nữa."
                </p>
                <div className="testi-name">Quỳnh Anh</div>
                <div className="testi-role">Học sinh lớp 11 · Hà Nội</div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 9: TẦM NHÌN & SỨ MỆNH — NGHỀ CHỌN NGƯỜI
          ============================================================ */}
      <section className="section" style={{ background: "var(--bg-dark)", color: "#fff" }}>
        <div className="container">
          <FadeIn>
            <div className="sec-label" style={{ color: "var(--accent)" }}>Về Nghề Chọn Người</div>
            <div className="sec-title" style={{ color: "#fff", marginBottom: 24 }}>
              Không phải mình chọn nghề.<br/>Mà là nghề — chọn đúng người.
            </div>
            <div style={{ fontFamily: "var(--serif)", fontSize: 16, lineHeight: 1.95, color: "rgba(255,255,255,0.6)" }}>
              <p style={{ marginBottom: 18 }}>
                Chúng tôi tin rằng mỗi người sinh ra đều mang trong mình một tố chất riêng — 
                một kiểu tư duy, một thế mạnh tự nhiên, một môi trường mà ở đó họ sẽ tỏa sáng.
              </p>
              <p style={{ marginBottom: 18 }}>
                Nhưng phần lớn mọi người chưa bao giờ được ai giúp nhìn thấy điều đó. 
                Họ chọn nghề theo cảm tính, theo kỳ vọng, theo số đông — rồi dành cả đời 
                tự hỏi: <span style={{ color: "var(--accent)", fontStyle: "italic" }}>"Đây có thật sự là con đường của mình không?"</span>
              </p>
              <p style={{ marginBottom: 18 }}>
                Nghề Chọn Người ra đời để thay đổi điều đó — bắt đầu từ thế hệ trẻ nhất.
              </p>
              <p>
                Sứ mệnh của chúng tôi: <strong style={{ color: "#fff" }}>Giúp mỗi học sinh Việt Nam 
                hiểu mình trước khi chọn nghề — để không ai phải hối hận vì một quyết định 
                được đưa ra trong mơ hồ.</strong>
              </p>
            </div>
          </FadeIn>
          <FadeIn>
            <div className="vision-grid">
              <div className="vision-card">
                <h4>🔬 Khoa học, không cảm tính</h4>
                <p>
                  Kết hợp nhiều phương pháp được nghiên cứu và ứng dụng thực tiễn trên toàn cầu.
                </p>
              </div>
              <div className="vision-card">
                <h4>🇻🇳 Thiết kế cho học sinh Việt</h4>
                <p>
                  Mọi nội dung đều được xây dựng trong bối cảnh giáo dục 
                  và thị trường lao động Việt Nam.
                </p>
              </div>
              <div className="vision-card">
                <h4>👨‍👩‍👧 Kết nối gia đình</h4>
                <p>
                  Không chỉ cho học sinh — mà cho cả gia đình. 
                  Vì chọn nghề là quyết định của cả nhà, không phải của riêng ai.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ============================================================
          SECTION 10: GIÁ TRỊ & CHI PHÍ
          ============================================================ */}
      <section className="section" style={{ background: "var(--bg-white)" }}>
        <div className="container">
          <FadeIn>
            <div className="sec-title" style={{ textAlign: "center" }}>
              Một quyết định có thể ảnh hưởng cả cuộc đời —<br/>
              xứng đáng được đầu tư bao nhiêu?
            </div>
          </FadeIn>
          <FadeIn>
            <div className="price-box">
              <div className="price-compare">
                <div className="price-row">
                  <span>Học phí đại học 4 năm</span>
                  <span className="val">80 – 400 triệu</span>
                </div>
                <div className="price-row">
                  <span>Chi phí nếu chọn sai, học lại</span>
                  <span className="val">Gấp đôi + nhiều năm</span>
                </div>
                <div className="price-row">
                  <span>Chi phí loay hoay nhiều năm</span>
                  <span className="val">Không đo đếm được</span>
                </div>
                <div className="price-row" style={{ borderBottom: "none" }}>
                  <span>Báo cáo Định vị Sự nghiệp</span>
                  <span className="val" style={{ color: "var(--accent)" }}>↓</span>
                </div>
              </div>
              <div className="price-main">{REPORT_PRICE}</div>
              <p className="price-note">
                Chưa bằng một bữa ăn ngoài cho cả nhà — nhưng có thể thay đổi 
                cả hướng đi của con.
              </p>
              <a href={QUIZ_URL} className="cta-main" target="_blank" rel="noopener" style={{ width: "100%", justifyContent: "center" }}>
                Nhận báo cáo ngay →
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ============================================================
          SECTION 11: FAQ
          ============================================================ */}
      <section className="section" style={{ background: "var(--bg-warm)" }}>
        <div className="container">
          <FadeIn>
            <div className="sec-title" style={{ marginBottom: 32 }}>
              Mấy câu anh chị hay hỏi
            </div>
          </FadeIn>
          <div className="faq-list">
            {faqs.map((f, i) => (
              <div className={`faq-item ${openFaq === i ? "open" : ""}`} key={i}>
                <button className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  {f.q}
                  <span className="faq-arr">▼</span>
                </button>
                {openFaq === i && <div className="faq-a">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          SECTION 12: FINAL CTA
          ============================================================ */}
      <section className="final">
        <FadeIn>
          <h2>
            Bố mẹ không thể đi cùng con cả cuộc đời.<br/>
            <span className="hl">Nhưng có thể giúp con bắt đầu đúng hướng.</span>
          </h2>
          <p className="fsub">
            Đầu tư {REPORT_PRICE} hôm nay — để có thêm cơ sở cho một quyết định 
            có thể ảnh hưởng đến nhiều năm phía trước.
          </p>
          <a href={QUIZ_URL} className="cta-main" target="_blank" rel="noopener">
            Nhận Báo cáo Định vị Sự nghiệp ngay →
          </a>
          <p className="cta-sub" style={{ marginTop: 16 }}>
            Bắt đầu bằng bài trắc nghiệm miễn phí · Kết quả trong vài phút
          </p>
        </FadeIn>
      </section>

      <footer className="footer">
        © 2026 Nghề Chọn Người · Định hướng nghề nghiệp cho học sinh Việt Nam
      </footer>
    </div>
  );
}
