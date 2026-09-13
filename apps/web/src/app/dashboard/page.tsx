"use client";

import { useEffect, useState, Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import { assessmentApi } from "@/lib/api";
import { CheckoutModal } from "@/components/dashboard/checkout-modal";
import { Lock, Star, CheckCircle, Loader2, ArrowLeft, Copy, Check, Link2 } from "lucide-react";
import Link from "next/link";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface AiInsights {
  insight_1: string;
  insight_2: string;
  insight_3: string;
}
interface AiRisk {
  risk_percent: number;
  risk_description: string;
}
interface Career {
  rank: number;
  title: string;
  match: number;
  reason: string;
  locked: boolean;
}
interface AvoidCareer {
  title: string;
  reason: string;
}
interface AiCareers {
  top_careers: Career[];
  avoid_careers: AvoidCareer[];
}
interface AiData {
  insights: AiInsights;
  risk: AiRisk;
  careers: AiCareers;
  cached?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Tính điểm phù hợp nghề nghiệp (0-100) — không cần Claude API */
function calculateMatchScore(assessment: any): number {
  const riasec = assessment?.riasecResult ?? {};
  const scores: number[] = [riasec.R ?? 0, riasec.I ?? 0, riasec.A ?? 0, riasec.S ?? 0, riasec.E ?? 0, riasec.C ?? 0];

  // 1. Độ nhất quán (0-50): top scores phân ly rõ = nhất quán cao
  const sorted = [...scores].sort((a, b) => b - a);
  const spread = (sorted[0] - sorted[sorted.length - 1]) / 100;
  const consistencyScore = Math.round(spread * 50);

  // 2. Độ khớp MBTI × Holland (0-30)
  const mbti = riasec.mbtiCode ?? "";
  const top3 = riasec.top3 ?? "";
  const naturalPairs: [string, string[]][] = [
    ["ENFP", ["S", "E", "A"]], ["ENFJ", ["S", "E"]],
    ["INFP", ["A", "S"]],      ["INFJ", ["A", "S"]],
    ["ENTP", ["I", "E"]],      ["ENTJ", ["E", "I"]],
    ["INTJ", ["I", "R", "C"]], ["INTP", ["I", "R"]],
    ["ESTP", ["E", "R"]],      ["ESTJ", ["E", "C"]],
    ["ISFP", ["A", "S"]],      ["ISFJ", ["S", "C"]],
    ["ESFP", ["S", "E"]],      ["ESFJ", ["S", "E"]],
    ["ISTP", ["R", "I"]],      ["ISTJ", ["R", "C"]],
  ];
  const pair = naturalPairs.find(([m]) => m === mbti);
  const compatibilityScore = pair
    ? Math.round((top3.split("").filter((k: string) => pair[1].includes(k)).length / 3) * 30)
    : 15;

  // 3. Bonus numerology (0-20)
  const lp = riasec.numerology?.LP ?? 0;
  const numerologyBonus = lp >= 1 && lp <= 9 ? 10 + lp : 10;

  return Math.min(100, consistencyScore + compatibilityScore + numerologyBonus);
}

/** Lấy màu và level của match score */
function getScoreLevel(score: number): "low" | "mid" | "high" {
  if (score < 50) return "low";
  if (score < 76) return "mid";
  return "high";
}

/** Countdown 24h từ localStorage */
function useCountdown(key: string) {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0, expired: false });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedTs = localStorage.getItem(key);
    let startTs = storedTs ? parseInt(storedTs) : Date.now();
    if (!storedTs) localStorage.setItem(key, String(startTs));

    const endTs = startTs + 24 * 60 * 60 * 1000;

    const tick = () => {
      const remaining = Math.max(0, endTs - Date.now());
      if (remaining === 0) { setTimeLeft({ h: 0, m: 0, s: 0, expired: true }); return; }
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      const s = Math.floor((remaining % 60000) / 1000);
      setTimeLeft({ h, m, s, expired: false });
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [key]);

  return timeLeft;
}

// ─────────────────────────────────────────────────────────────────────────────
// STATIC DATA
// ─────────────────────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    name: "Phụ huynh em Thanh Hà",
    location: "Hà Nội",
    text: "Con đọc xong bỏ ngay ý định thi Kinh tế vì biết mình thuộc nhóm sáng tạo. Giờ con đang học Truyền thông và rất hạnh phúc.",
    role: "Phụ huynh",
  },
  {
    name: "Phụ huynh em Khánh Linh",
    location: "Hà Giang",
    text: "Chỉ hơn 500k mà tránh được 4 năm học sai ngành. Đáng lắm. Chúng tôi đã mua cho cả 2 con.",
    role: "Phụ huynh",
  },
  {
    name: "Phụ huynh em Minh Khôi",
    location: "Đà Nẵng",
    text: "Con trai tôi cứ phân vân giữa Bách Khoa và Kinh tế suốt 2 năm. Sau khi có báo cáo, con tự tin chọn ngay Công nghệ thông tin. Kết quả thi đầu vào rất tốt.",
    role: "Phụ huynh",
  },
  {
    name: "Phụ huynh em Bảo Ngọc",
    location: "TP. Hồ Chí Minh",
    text: "Tôi vốn muốn con học Y. Nhưng đọc báo cáo thấy con phù hợp với ngành Nghệ thuật-Thiết kế hơn nhiều. Ban đầu tôi phản đối, nhưng nhìn con vẽ từng ngày thấy con đúng. Cảm ơn NCN!",
    role: "Phụ huynh",
  },
  {
    name: "Phụ huynh em Thu Trang",
    location: "Cần Thơ",
    text: "Báo cáo phân tích rất sâu, không phải mấy cái trắc nghiệm thông thường. Con gái đọc xong tự lên kế hoạch học tập luôn. Mẹ yên tâm hơn rất nhiều.",
    role: "Phụ huynh",
  },
  {
    name: "Phụ huynh em Gia Huy",
    location: "Bình Dương",
    text: "Con hay nói 'con không biết mình muốn gì'. Sau bài test và báo cáo, con nói 'Con muốn làm về dữ liệu'. Lần đầu tiên tôi thấy con có định hướng rõ ràng như vậy.",
    role: "Phụ huynh",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE — wrapped in Suspense for useSearchParams()
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#243049" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#E8A838" }} />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const { user } = useAuth();

  const [assessment, setAssessment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [aiData, setAiData] = useState<AiData | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [matchScore, setMatchScore]     = useState(0);
  const [affiliateCopied, setAffiliateCopied] = useState(false);

  const affiliateCode = user?.affiliateCode ?? null;
  const affiliateLink = affiliateCode ? `https://quiz.nghechonnguoi.com/ref/${affiliateCode}` : "";

  const handleAffiliateCopy = () => {
    if (!affiliateLink) return;
    navigator.clipboard.writeText(affiliateLink);
    setAffiliateCopied(true);
    setTimeout(() => setAffiliateCopied(false), 2000);
  };

  /** Lấy top 5 nghề từ assessment (cùng nguồn với báo cáo đầy đủ) */
  function getAssessmentCareers(a: any): Career[] {
    const raw = a?.careerResult;
    const list: any[] = Array.isArray(raw) ? raw : (raw?.university ?? raw?.vocational ?? []);
    return list.slice(0, 5).map((c: any, i: number) => ({
      rank: i + 1,
      title: c.name ?? c.title ?? "",
      match: Math.round(c.pct ?? c.match ?? 0),
      reason: c.niche ?? c.reason ?? "",
      locked: true,
    }));
  }

  const countdownKey = `ncn_countdown_${user?.id ?? "guest"}`;
  useCountdown(countdownKey);

  // ── Tải assessment ──────────────────────────────────────────────────────
  function loadAssessment() {
    setIsLoading(true);

    // Kiểm tra sessionStorage trước (kết quả guest vừa submit)
    const trySessionStorage = () => {
      try {
        const cached = sessionStorage.getItem("ncn_last_result");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.assessment?.id) {
            // Chuyển đổi định dạng result sang assessment format
            const fakeAssessment = {
              id: parsed.assessment.id,
              riasecResult: { ...parsed.riasecResult, mbtiCode: parsed.riasecResult?.mbtiCode },
              careerResult: {
                track: parsed.track,
                university: parsed.careerResult,
                vocational: parsed.vocationalCareerResult ?? null,
                profile: parsed.profile ?? null,
              },
              createdAt: new Date().toISOString(),
            };
            setAssessment(fakeAssessment);
            setMatchScore(calculateMatchScore(fakeAssessment));
            return true;
          }
        }
      } catch {}
      return false;
    };

    assessmentApi.list()
      .then((list: any[]) => {
        const resetDate = new Date("2026-07-05T00:00:00.000Z");
        const valid = list.filter((a) => new Date(a.createdAt) >= resetDate);
        if (valid.length > 0) {
          setAssessment(valid[0]);
          setMatchScore(calculateMatchScore(valid[0]));
        } else {
          // Không có assessment từ DB → thử sessionStorage (guest mode)
          trySessionStorage();
        }
      })
      .catch(() => {
        // API lỗi (chưa login) → thử sessionStorage
        trySessionStorage();
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(() => { loadAssessment(); }, []);


  // ── Gọi AI khi có assessment ────────────────────────────────────────────
  useEffect(() => {
    if (!assessment) return;
    const riasec = assessment.riasecResult ?? {};
    const mbti = riasec.mbtiCode ?? "ENFP";
    const holland = riasec.top3 ?? "AIE";
    const lifePath = riasec.numerology?.LP ?? null;
    const riasecScores = { R: riasec.R ?? 0, I: riasec.I ?? 0, A: riasec.A ?? 0, S: riasec.S ?? 0, E: riasec.E ?? 0, C: riasec.C ?? 0 };

    setAiLoading(true);
    fetch("/api/dashboard-ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mbti, holland, lifePath, riasecScores, assessmentId: assessment.id }),
    })
      .then((r) => r.json())
      .then((data: AiData) => setAiData(data))
      .catch(() => {})
      .finally(() => setAiLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessment?.id]);

  // ── Redirect nếu không có assessment ───────────────────────────────────
  if (!isLoading && !assessment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
        style={{ background: "#243049" }}>
        <div className="text-6xl mb-6">📝</div>
        <h1 className="text-2xl font-black text-white mb-3">Bạn chưa làm bài test</h1>
        <p className="text-white/60 mb-8 max-w-sm">
          Làm bài test 5 phút để khám phá TOP 5 nghề phù hợp nhất với tính cách và thế mạnh của bạn.
        </p>
        <Link
          href="/assessment"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base transition-all hover:scale-105"
          style={{ background: "#E8A838", color: "#1B2A4A" }}
        >
          Bắt đầu bài test
        </Link>
      </div>
    );
  }

  const firstName = (
    assessment?.careerResult?.profile?.fullName ||
    user?.name || "bạn"
  ).split(" ").pop() ?? "bạn";

  const userEmail = assessment?.careerResult?.profile?.email || user?.email;
  const userPhone = assessment?.careerResult?.profile?.phone;
  const userName  = assessment?.careerResult?.profile?.fullName || user?.name || "Học sinh";

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1 — HERO: Chỉ số phù hợp nghề nghiệp
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: "#243049", color: "#fff", paddingBottom: 56 }}>
        {/* Minimal top bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <Link href="/assessment" className="flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-70"
            style={{ color: "rgba(255,255,255,0.5)" }}>
            <ArrowLeft className="w-3.5 h-3.5" /> Làm lại bài test
          </Link>
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#E8A838" }}>
            NCN ACADEMY
          </span>
          {user && (
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              {user.email}
            </span>
          )}
        </div>

        {/* ── ZALO CONTACT #1 — ĐẦU TRANG ── */}
        <div className="flex justify-center px-5 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.15)" }}>
          <a
            href="https://zalo.me/0986864591"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 active:scale-95"
            style={{ background: "rgba(0,120,200,0.2)", border: "1px solid rgba(0,120,200,0.4)", color: "#6ec6f5" }}
          >
            <svg width="16" height="16" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
              <rect width="48" height="48" rx="10" fill="#0078C8"/>
              <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="26" fontWeight="bold" fontFamily="Arial">Z</text>
            </svg>
            Liên hệ Admin để được tư vấn miễn phí
            <span style={{ color: "rgba(110,198,245,0.6)", fontSize: 10 }}>· 0986.864.591</span>
          </a>
        </div>

        <div className="max-w-2xl mx-auto px-5 pt-10 text-center">
          {isLoading ? (
            <div className="flex items-center justify-center gap-3 py-16">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#E8A838" }} />
              <span className="text-white/60">Đang tải kết quả...</span>
            </div>
          ) : (
            <>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                KẾT QUẢ CỦA BẠN
              </p>
              <h1 className="text-2xl sm:text-3xl font-black text-white mb-1">
                Xin chào, <span style={{ color: "#E8A838" }}>{firstName}</span>!
              </h1>

              {/* SVG Score Meter */}
              <div className="flex flex-col items-center my-8">
                <MatchScoreRing score={matchScore} />
                <p className="text-base font-bold text-white mt-4">Chỉ số phù hợp nghề nghiệp</p>
                <p className="text-xs mt-1.5 max-w-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                  Con số này cho biết câu trả lời của bạn rõ ràng đến đâu trong việc chỉ ra nhóm nghề phù hợp.
                </p>
              </div>

              {/* Thang 3 mức — 1 dòng ngang */}
              <ScaleMeter score={matchScore} />
            </>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2 — CHÂN DUNG ĐỌC VỊ
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-5" style={{ background: "#fff" }}>
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-2 text-center" style={{ color: "#E8A838" }}>
            CHÂN DUNG CỦA BẠN
          </p>
          <h2 className="text-xl sm:text-2xl font-black text-center mb-8" style={{ color: "#1B2A4A" }}>
            Những điều có thể bạn chưa từng nghe ai nói
          </h2>

          {aiLoading ? (
            <div className="flex flex-col gap-4">
              {[0,1,2].map((i) => (
                <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: "#f1f5f9" }} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {[
                { icon: "🪞", text: aiData?.insights?.insight_1 ?? "" },
                { icon: "🧭", text: aiData?.insights?.insight_2 ?? "" },
                { icon: "💡", text: aiData?.insights?.insight_3 ?? "" },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 rounded-2xl p-5"
                  style={{ background: "#fffbf0", border: "1px solid #f0e6d0" }}>
                  <span className="text-2xl flex-shrink-0">{item.icon}</span>
                  <p className="text-sm leading-relaxed text-gray-700">{item.text}</p>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-center mt-6" style={{ color: "#94a3b8" }}>
            * Phân tích CÁ NHÂN HÓA — không phải mô tả chung chung có thể áp dụng cho bất kỳ ai.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3 — GỢI Ý NGHỀ NGHIỆP (Top 5)
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-5" style={{ background: "#f8fafc" }}>
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-2 text-center" style={{ color: "#E8A838" }}>
            GỢI Ý NGHỀ NGHIỆP
          </p>
          <h2 className="text-xl sm:text-2xl font-black text-center mb-8" style={{ color: "#1B2A4A" }}>
            5 nghề phù hợp nhất với bạn
          </h2>

          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[0,1,2,3,4].map((i) => (
                <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: "#e2e8f0" }} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {(() => {
                const careers = getAssessmentCareers(assessment);
                const list = careers.length > 0 ? careers : [1,2,3,4,5].map((rank) => ({
                  rank,
                  title: `Nghề phù hợp #${rank}`,
                  match: 0,
                  reason: "",
                  locked: true,
                }));
                return list.map((career) => (
                  <CareerCard key={career.rank} career={career} onUnlock={() => setCheckoutOpen(true)} />
                ));
              })()}
            </div>
          )}

          {/* 3 nghề nên tránh — locked */}
          <div className="mt-5 rounded-2xl p-5 flex items-start gap-3"
            style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
            <span className="text-2xl flex-shrink-0">🚫</span>
            <div className="flex-1">
              <p className="font-bold text-gray-900 text-sm mb-0.5">3 nghề bạn nên tránh</p>
              <p className="text-xs text-gray-500">
                Những ngành trông hấp dẫn nhưng sẽ khiến bạn chán sau 1–2 năm — có trong báo cáo đầy đủ
              </p>
            </div>
            <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#fca5a5" }} />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 4 — CẢNH BÁO RỦI RO
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-5" style={{ background: "#243049" }}>
        <div className="max-w-2xl mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <span className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest"
              style={{ background: "rgba(232,168,56,0.15)", border: "1px solid rgba(232,168,56,0.4)", color: "#E8A838" }}>
              ⚠️ CẢNH BÁO
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white text-center mb-8">
            Rủi ro lớn nhất nếu bạn chọn sai ngành
          </h2>

          {/* Risk stat */}
          <div className="text-center mb-10">
            {aiLoading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-24 h-14 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.08)" }} />
                <div className="w-64 h-4 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.08)" }} />
              </div>
            ) : (
              <>
                <div className="text-6xl font-black mb-3" style={{ color: "#E8A838" }}>
                  {aiData?.risk?.risk_percent ?? 73}%
                </div>
                <p className="text-sm max-w-sm mx-auto" style={{ color: "rgba(255,255,255,0.65)" }}>
                  {aiData?.risk?.risk_description}
                </p>
              </>
            )}
          </div>

          {/* 3 hậu quả tĩnh */}
          <div className="flex flex-col gap-3 mb-5">
            {[
              { icon: "⏳", title: "Mất 4 năm thanh xuân", desc: "Học ngành không phù hợp, mỗi ngày đến trường đều mệt mỏi" },
              { icon: "💸", title: "Mất hàng trăm triệu đồng", desc: "Học phí + chi phí sinh hoạt + chi phí cơ hội nếu phải học lại" },
              { icon: "😞", title: "Ra trường làm trái nghề", desc: "Không có động lực, thu nhập thấp, muốn chuyển ngành nhưng đã muộn" },
            ].map((item, i) => (
              <div key={i} className="rounded-xl p-4 flex items-start gap-3"
                style={{ background: "rgba(255,255,255,0.06)", borderLeft: "3px solid #E8A838" }}>
                <span className="text-xl flex-shrink-0">{item.icon}</span>
                <div>
                  <p className="font-bold text-sm text-white">{item.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Khóa: môi trường làm việc */}
          <div className="rounded-xl p-4 flex items-start gap-3"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px dashed rgba(255,255,255,0.2)" }}>
            <span className="text-xl">🏢</span>
            <div className="flex-1">
              <p className="font-bold text-sm text-white">Môi trường làm việc phù hợp để bạn phát triển</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                Không phải nghề nào cũng hợp — môi trường sai cũng khiến bạn thất bại dù chọn đúng nghề
              </p>
            </div>
            <Lock className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(255,255,255,0.3)" }} />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 5 — CƠ HỘI (TĨNH)
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-5" style={{ background: "#fff" }}>
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-2 text-center" style={{ color: "#2BA88C" }}>
            CƠ HỘI
          </p>
          <h2 className="text-xl sm:text-2xl font-black text-center mb-8" style={{ color: "#1B2A4A" }}>
            Nếu chọn đúng ngành, bạn có thể...
          </h2>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: "🎯", title: "Tự tin suốt 4 năm ĐH", desc: "Biết mình đang đi đúng hướng, không hoang mang giữa chừng" },
              { icon: "💰", title: "Thu nhập cao hơn 30–50%", desc: "So với người làm trái ngành, theo thống kê từ VietnamWorks 2024" },
              { icon: "🚀", title: "Phát triển sự nghiệp nhanh hơn", desc: "Vì bạn đang chơi trên sân mạnh nhất của mình" },
            ].map((item, i) => (
              <div key={i} className="rounded-2xl p-5"
                style={{ background: "#f0fdf9", border: "1px solid #d1fae5" }}>
                <div className="text-2xl mb-3">{item.icon}</div>
                <p className="font-bold text-gray-900 text-sm mb-1">{item.title}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ZALO CONTACT #2 — GIỮA TRANG ── */}
      <section className="py-6 px-5" style={{ background: "#eef6ff" }}>
        <div className="max-w-2xl mx-auto">
          <a
            href="https://zalo.me/0986864591"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-4 rounded-2xl px-5 py-4 transition-all hover:opacity-95 active:scale-[0.99]"
            style={{ background: "linear-gradient(135deg, #0078C8 0%, #1a94e0 100%)", boxShadow: "0 4px 20px rgba(0,120,200,0.25)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.2)" }}>
                <svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="48" height="48" rx="10" fill="rgba(255,255,255,0.3)"/>
                  <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="26" fontWeight="bold" fontFamily="Arial">Z</text>
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-white">💬 Còn thắc mắc? Hỏi Admin ngay!</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.75)" }}>Tư vấn miễn phí · Phản hồi trong vòng 5 phút · Zalo: 0986.864.591</p>
              </div>
            </div>
            <div className="flex-shrink-0 flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold" style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>
              Nhắn Zalo
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </div>
          </a>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 6 — BẰNG CHỨNG XÃ HỘI (TĨNH)
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-5" style={{ background: "#f8fafc" }}>
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-2 text-center" style={{ color: "#E8A838" }}>
            BẰNG CHỨNG
          </p>
          <h2 className="text-xl sm:text-2xl font-black text-center mb-8" style={{ color: "#1B2A4A" }}>
            Không chỉ bạn — hàng ngàn học sinh đã hành động
          </h2>

          {/* Số liệu */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            {[
              { num: "2.840+", label: "bài test đã hoàn thành" },
              { num: "94%",    label: "tự tin hơn khi chọn ngành" },
              { num: "★★★★★", label: "đánh giá từ phụ huynh" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div
                  className="text-xl sm:text-2xl font-black"
                  style={{ color: i === 2 ? "#E8A838" : "#111827" }}
                >
                  {s.num}
                </div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Testimonials */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="rounded-2xl p-5 bg-white flex flex-col gap-3" style={{ border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                {/* Stars + badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5">
                    {[0,1,2,3,4].map((s) => (
                      <Star key={s} className="w-3.5 h-3.5 fill-current" style={{ color: "#E8A838" }} />
                    ))}
                  </div>
                  {t.role && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(43,168,140,0.1)", color: "#2BA88C" }}>
                      ✓ {t.role}
                    </span>
                  )}
                </div>
                {/* Quote */}
                <p className="text-sm text-gray-700 leading-relaxed flex-1">"{t.text}"</p>
                {/* Author */}
                <div className="flex items-center gap-2.5 pt-1" style={{ borderTop: "1px solid #f1f5f9" }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #2BA88C, #1B2A4A)" }}>
                    {t.name.split(" ").slice(-1)[0][0]}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 7 — BÁO CÁO ĐẦY ĐỦ (TĨNH)
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-5" style={{ background: "#fff" }}>
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-2 text-center" style={{ color: "#E8A838" }}>
            BÁO CÁO ĐẦY ĐỦ BAO GỒM
          </p>
          <h2 className="text-xl sm:text-2xl font-black text-center mb-8" style={{ color: "#1B2A4A" }}>
            Toàn bộ bản đồ sự nghiệp — cá nhân hóa cho bạn
          </h2>

          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
            {[
              "5 nghề phù hợp nhất — phân tích chi tiết từng nghề",
              "3 nghề nên tránh — và lý do cụ thể",
              "Môi trường làm việc tối ưu cho tính cách của bạn",
              "Lộ trình: ngành học → nghề nghiệp → mức thu nhập",
              "Chiến lược phát triển sự nghiệp 5 năm tới",
            ].map((item, i) => (
              <div key={i}
                className="flex items-center gap-3 px-5 py-4"
                style={{ borderBottom: i < 4 ? "1px solid #f1f5f9" : undefined }}>
                <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#2BA88C" }} />
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 8 — CTA + GIÁ + COUNTDOWN
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-5"
        style={{ background: "linear-gradient(135deg, #1B2A4A 0%, #2d4a7a 100%)" }}>
        <div className="max-w-xl mx-auto text-center">




          {/* CTA Button */}
          <button
            onClick={() => setCheckoutOpen(true)}
            id="cta-main-checkout"
            className="w-full py-5 px-6 rounded-2xl font-black text-sm sm:text-base leading-snug transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xl"
            style={{
              background: "linear-gradient(135deg, #E8A838 0%, #f0c060 100%)",
              color: "#1B2A4A",
              boxShadow: "0 8px 32px rgba(232,168,56,0.35)",
            }}
          >
            XEM NGAY 5 NGHỀ PHÙ HỢP NHẤT VỚI BẠN
            <br />
            <span className="text-xs font-semibold opacity-80">& ĐỊNH HƯỚNG PHÁT TRIỂN TRONG TƯƠNG LAI</span>
          </button>

          {/* ── ZALO CONTACT ── */}
          <div className="mt-5 rounded-2xl px-5 py-4" style={{ background: "rgba(0,120,200,0.12)", border: "1px solid rgba(0,120,200,0.3)" }}>
            <p className="text-xs font-semibold mb-3" style={{ color: "rgba(255,255,255,0.55)" }}>🔒 Thanh toán an toàn · Có câu hỏi về đơn hàng?</p>
            <a
              href="https://zalo.me/0986864591"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95"
              style={{ background: "rgba(0,120,200,0.25)", border: "1px solid rgba(0,120,200,0.5)", color: "#7dd3fc" }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                <rect width="48" height="48" rx="10" fill="#0078C8"/>
                <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="26" fontWeight="bold" fontFamily="Arial">Z</text>
              </svg>
              Liên hệ Admin qua Zalo — 0986.864.591
            </a>
            <p className="text-xs text-center mt-2" style={{ color: "rgba(255,255,255,0.35)" }}>Admin sẵn sàng hỗ trợ thanh toán và giải đáp mọi thắc mắc</p>
          </div>

          <p className="text-sm font-bold mt-5" style={{ color: "#E8A838" }}>
            ⚡ Đừng bỏ lỡ tương lai chỉ vì sự chần chừ của hôm nay.
          </p>

        </div>
      </section>

      {/* AFFILIATE BANNER — chỉ hiện khi user có affiliate code */}
      {affiliateCode && (
        <section className="px-5 py-8" style={{ background: "#1a2540" }}>
          <div className="max-w-2xl mx-auto">
            <div
              className="rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              style={{
                background: "linear-gradient(135deg, rgba(43,168,140,0.15) 0%, rgba(43,168,140,0.05) 100%)",
                border: "1px solid rgba(43,168,140,0.3)",
              }}
            >
              {/* Icon + text */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(43,168,140,0.2)" }}
                >
                  <Link2 className="w-5 h-5" style={{ color: "#2BA88C" }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white">Link affiliate của bạn</p>
                  <p className="text-xs truncate font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                    nghechonnguoi.com/ref/<span style={{ color: "#2BA88C" }}>{affiliateCode}</span>
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleAffiliateCopy}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                  style={{
                    background: affiliateCopied ? "#2BA88C" : "rgba(43,168,140,0.2)",
                    color: affiliateCopied ? "#fff" : "#2BA88C",
                    border: "1px solid rgba(43,168,140,0.4)",
                  }}
                >
                  {affiliateCopied ? (
                    <><Check className="w-3.5 h-3.5" /> Đã copy!</>
                  ) : (
                    <><Copy className="w-3.5 h-3.5" /> Copy link</>
                  )}
                </button>
                <a
                  href="https://zalo.me/g/lilbiycoxygz5arb5bj2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-80"
                  style={{ background: "rgba(0,120,200,0.15)", color: "#4DA6FF", border: "1px solid rgba(0,120,200,0.3)" }}
                  title="Tham gia nhóm Zalo Affiliate"
                >
                  <svg width="15" height="15" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="48" height="48" rx="10" fill="#0078C8"/>
                    <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="26" fontWeight="bold" fontFamily="Arial">Z</text>
                  </svg>
                  Nhóm Zalo
                </a>
                <Link
                  href="/affiliate"
                  className="px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-80"
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}
                >
                  Xem hoa hồng
                </Link>
              </div>
            </div>

            {/* Zalo community link */}
            <div className="mt-3 text-center">
              <a
                href="https://zalo.me/g/lilbiycoxygz5arb5bj2"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ color: "#2BA88C" }}
              >
                <svg width="18" height="18" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="48" height="48" rx="10" fill="#2BA88C"/>
                  <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold" fontFamily="Arial">Z</text>
                </svg>
                Tham gia Cộng đồng Affiliate Nghề Chọn Người
              </a>
            </div>
          </div>
        </section>
      )}

      {/* RETAKE SURVEY */}
      <section className="py-10 px-5 text-center" style={{ background: "#f8fafc" }}>
        <p className="text-xs text-gray-400 mb-3">Muốn làm lại để có kết quả chính xác hơn?</p>
        <a
          href="/assessment"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all hover:opacity-80 active:scale-95"
          style={{
            background: "transparent",
            border: "1.5px solid #cbd5e1",
            color: "#64748b",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 4v6h6" />
            <path d="M3.51 15a9 9 0 1 0 .49-3.29" />
          </svg>
          Làm lại bài phân tích
        </a>
      </section>

      {/* FOOTER */}
      <footer className="py-6 text-center text-xs" style={{ background: "#1B2A4A", color: "rgba(255,255,255,0.3)" }}>
        © NCN Academy — Nghề Chọn Người
      </footer>

      {/* Checkout Modal */}
      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onPurchaseSuccess={() => {
          // Sau khi xuất báo cáo xong: reload data để dashboard cập nhật trạng thái đã mua
          setCheckoutOpen(false);
          loadAssessment();
        }}
        assessment={assessment}
        userName={userName}
        userEmail={userEmail}
        userPhone={userPhone}
        avoidCareers={aiData?.careers?.avoid_careers ?? []}
      />

      {/* ── ZALO FLOATING BUTTON — luôn nổi, click vào tin nhắn ngay ── */}
      <a
        href="https://zalo.me/0986864591"
        target="_blank"
        rel="noopener noreferrer"
        title="Nhắn tin Zalo Admin — 0986.864.591"
        style={{
          position: "fixed",
          bottom: 24,
          right: 20,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          textDecoration: "none",
          filter: "drop-shadow(0 4px 16px rgba(0,120,200,0.5))",
        }}
      >
        {/* Vòng pulse animation */}
        <span style={{
          position: "absolute",
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "rgba(0,120,200,0.25)",
          animation: "zalo-pulse 1.8s ease-out infinite",
          top: 0,
          left: 0,
        }} />
        {/* Icon Zalo chính thức */}
        <span style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "#0078C8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 20px rgba(0,120,200,0.6)",
          position: "relative",
        }}>
          <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <text x="50%" y="58%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold" fontFamily="Arial, sans-serif">Z</text>
          </svg>
        </span>
        {/* Label nhỏ bên dưới */}
        <span style={{
          background: "#0078C8",
          color: "#fff",
          fontSize: 10,
          fontWeight: 700,
          padding: "2px 8px",
          borderRadius: 20,
          whiteSpace: "nowrap",
          letterSpacing: 0.3,
          boxShadow: "0 2px 8px rgba(0,120,200,0.4)",
        }}>
          Nhắn Zalo
        </span>
      </a>

      {/* CSS animation cho Zalo pulse */}
      <style>{`
        @keyframes zalo-pulse {
          0%   { transform: scale(1);   opacity: 0.8; }
          70%  { transform: scale(1.9); opacity: 0;   }
          100% { transform: scale(1.9); opacity: 0;   }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

/** SVG vòng tròn điểm phù hợp */
function MatchScoreRing({ score }: { score: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const level = getScoreLevel(score);
  const strokeColor = level === "high" ? "#2BA88C" : level === "mid" ? "#E8A838" : "#ef4444";
  const dashoffset = circ - (score / 100) * circ;

  return (
    <div className="relative flex items-center justify-center" style={{ width: 144, height: 144 }}>
      <svg width={144} height={144} className="absolute inset-0" style={{ transform: "rotate(-90deg)" }}>
        <circle cx={72} cy={72} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={10} />
        <circle
          cx={72} cy={72} r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={dashoffset}
          style={{ transition: "stroke-dashoffset 1.2s ease" }}
        />
      </svg>
      <div className="relative text-center">
        <div className="text-3xl font-black text-white">{score}</div>
        <div className="text-xs font-semibold" style={{ color: strokeColor }}>/100</div>
      </div>
    </div>
  );
}

/** Thang 3 mức hiển thị trên 1 dòng ngang */
function ScaleMeter({ score }: { score: number }) {
  const level = getScoreLevel(score);
  const levels = [
    { id: "low",  color: "#ef4444", label: "🔴 Dưới 50",  sublabel: "Chưa rõ hướng" },
    { id: "mid",  color: "#E8A838", label: "🟡 50–75",     sublabel: "Có xu hướng" },
    { id: "high", color: "#2BA88C", label: "🟢 76–100",    sublabel: "Rõ ràng ✓" },
  ] as const;

  return (
    <div className="flex items-stretch rounded-2xl overflow-hidden mx-auto max-w-sm"
      style={{ background: "rgba(255,255,255,0.07)" }}>
      {levels.map((lv, i) => {
        const active = level === lv.id;
        return (
          <div
            key={lv.id}
            className="flex-1 flex flex-col items-center justify-center py-3 px-2 text-center transition-all"
            style={{
              opacity: active ? 1 : 0.4,
              borderRight: i < 2 ? "1px solid rgba(255,255,255,0.12)" : undefined,
              background: active ? "rgba(255,255,255,0.06)" : undefined,
            }}
          >
            <span className="text-xs font-bold" style={{ color: active ? lv.color : "#fff", fontSize: 11 }}>
              {lv.label}
            </span>
            <span className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.55)", fontSize: 10 }}>
              {lv.sublabel}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Career card component */
function CareerCard({ career, onUnlock }: { career: Career; onUnlock: () => void }) {
  if (career.locked) {
    return (
      <div
        className="rounded-2xl p-4 flex items-center gap-3 cursor-pointer transition-all hover:opacity-90"
        style={{ background: "#f1f5f9", border: "1px dashed #cbd5e1", opacity: 0.85 }}
        onClick={onUnlock}
      >
        <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
          style={{ background: "#e2e8f0", color: "#94a3b8" }}>
          {career.rank}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#94a3b8" }} />
            <span className="text-sm font-bold text-gray-400">
              Nghề phù hợp #{career.rank} — phù hợp hơn cả 2 nghề bên dưới
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>Mở khóa trong báo cáo đầy đủ</p>
        </div>
        {career.match > 0 && (
          <div className="text-right flex-shrink-0">
            <div className="text-sm font-black" style={{ color: "#94a3b8" }}>{career.match}%</div>
            <div className="text-xs" style={{ color: "#cbd5e1" }}>phù hợp</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4 flex items-center gap-3 bg-white"
      style={{ border: "1px solid #e2e8f0" }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 text-white"
        style={{ background: "#2BA88C" }}>
        {career.rank}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-gray-900">{career.title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{career.reason}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-sm font-black" style={{ color: "#2BA88C" }}>{career.match}%</div>
        <div className="text-xs text-gray-400">phù hợp</div>
      </div>
    </div>
  );
}
