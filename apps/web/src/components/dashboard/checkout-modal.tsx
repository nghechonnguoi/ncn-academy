"use client";

import { useState, useEffect, useRef } from "react";
import { X, Loader2, CheckCircle, Copy, Tag, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
const PRICE = 568000;
const PRICE_DISPLAY = "568.000đ";
const BANK_BIN    = process.env.NEXT_PUBLIC_BANK_BIN    ?? "OCB";
const BANK_ACCT   = process.env.NEXT_PUBLIC_BANK_ACCT   ?? "61666666";
const BANK_OWNER  = process.env.NEXT_PUBLIC_BANK_OWNER  ?? "PHAM THI NGAN";

// ─────────────────────────────────────────────────────────────────────────────
interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  assessment: any;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  avoidCareers?: { title: string; reason: string }[];
}

type PayStep = "form" | "qr" | "processing" | "done" | "error";

export function CheckoutModal({
  open,
  onClose,
  assessment,
  userName,
  userEmail,
  userPhone,
  avoidCareers = [],
}: CheckoutModalProps) {
  const [payStep, setPayStep]           = useState<PayStep>("form");
  const [coupon, setCoupon]             = useState("");
  const [couponMsg, setCouponMsg]       = useState("");
  const [couponOk, setCouponOk]         = useState(false);
  const [couponCode, setCouponCode]     = useState(""); // mã đã validate thành công
  const [finalAmount, setFinalAmount]   = useState(PRICE);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder]   = useState(false);
  const [qrUrl, setQrUrl]               = useState("");
  const [qrDesc, setQrDesc]             = useState("");
  const [pdfUrl, setPdfUrl]             = useState("");
  const [errorMsg, setErrorMsg]         = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // orderCode được tạo 1 lần duy nhất khi modal mở, dùng chung cho mọi bước
  const orderCodeRef = useRef<number>(0);

  // Tạo orderCode từ assessment id (stable)
  function buildOrderCode() {
    const rawId = assessment?.id ?? "";
    const nums = rawId.replace(/[^0-9]/g, "");
    if (nums) return parseInt(nums.slice(-8));
    return Math.floor(Math.random() * 900000) + 100000;
  }

  // Reset khi đóng modal
  useEffect(() => {
    if (!open) {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      setPayStep("form");
      setCoupon(""); setCouponMsg(""); setCouponOk(false); setCouponCode("");
      setFinalAmount(PRICE); setQrUrl(""); setQrDesc("");
      setErrorMsg(""); setPdfUrl("");
      orderCodeRef.current = 0;
    } else {
      // Generate orderCode 1 lần duy nhất khi modal mở
      if (!orderCodeRef.current) {
        orderCodeRef.current = buildOrderCode();
      }
    }
  }, [open]);

  // ── Polling order status ──────────────────────────────────────────────────
  function startPolling(oc: number) {
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/order-status?orderCode=${oc}`);
        const data = await res.json();

        if (data.status === "PAID" && !data.pdfBase64 && !data.pdfDone) {
          setPayStep("processing");
        }

        if (data.pdfDone && data.pdfBase64) {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          // Decode base64 → blob URL
          try {
            const bytes = Uint8Array.from(atob(data.pdfBase64), (c) => c.charCodeAt(0));
            const blob = new Blob([bytes], { type: "application/pdf" });
            setPdfUrl(URL.createObjectURL(blob));
          } catch {}
          setPayStep("done");
        }
      } catch {}
    }, 3000);
  }

  // ── Áp dụng mã giảm giá (chỉ validate, KHÔNG mark USED) ─────────────────
  async function handleApplyCoupon() {
    const code = coupon.trim().toUpperCase();
    if (!code) { setCouponMsg("Vui lòng nhập mã giảm giá"); return; }
    setIsApplyingCoupon(true); setCouponMsg("");
    try {
      const res = await fetch("/api/apply-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // action: "validate" — chỉ kiểm tra mã, chưa ghi gì vào database
        body: JSON.stringify({ coupon: code, action: "validate" }),
      });
      const data = await res.json();
      if (data.success) {
        setCouponOk(true); setCouponCode(code); setFinalAmount(0);
        setCouponMsg("✅ Mã hợp lệ! Miễn phí 100%");
      } else {
        setCouponMsg(`❌ ${data.message || "Mã không hợp lệ"}`);
      }
    } catch {
      setCouponMsg("❌ Có lỗi khi kiểm tra mã");
    } finally {
      setIsApplyingCoupon(false);
    }
  }

  // ── Tạo đơn hàng + hiển thị QR ──────────────────────────────────────────
  async function handleCreateOrder() {
    setIsCreatingOrder(true); setErrorMsg("");
    // Dùng orderCode đã được generate 1 lần từ khi mở modal
    const oc = orderCodeRef.current || buildOrderCode();
    if (!orderCodeRef.current) orderCodeRef.current = oc;
    const pdfPayload = buildPdfPayload(assessment, userName, userEmail, userPhone, avoidCareers);

    try {
      if (finalAmount === 0) {
        // Miễn phí — apply coupon (mark USED + update order) rồi tạo PDF
        setPayStep("processing");

        // 1. Apply coupon: mark USED và cập nhật order status PAID
        const applyRes = await fetch("/api/apply-coupon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ coupon: couponCode, orderCode: String(oc), action: "apply" }),
        });
        const applyData = await applyRes.json();
        if (!applyData.success) {
          throw new Error(applyData.message || "Lỗi áp dụng mã ưu đãi");
        }

        // 2. Tạo order record (có thể đã được set bởi apply-coupon, dùng merge)
        await fetch("/api/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderCode:     oc,
            orderId:       `NCN-${oc}`,
            amount:        0,
            customerName:  userName,
            customerEmail: userEmail ?? "",
            customerPhone: userPhone ?? "",
            payload:       pdfPayload,
          }),
        });

        // 3. Tạo PDF
        const pdfRes = await fetch("/api/generate-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pdfPayload),
        });
        if (!pdfRes.ok) throw new Error("Lỗi tạo PDF");
        const blob = await pdfRes.blob();
        setPdfUrl(URL.createObjectURL(blob));
        setPayStep("done");
        return;
      }

      // 1. Tạo order PENDING qua API route (dùng firebase-admin server-side)
      await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderCode:     oc,
          orderId:       `NCN-${oc}`,
          amount:        finalAmount,
          customerName:  userName,
          customerEmail: userEmail ?? "",
          customerPhone: userPhone ?? "",
          payload:       pdfPayload,
        }),
      });

      // 2. Gọi PayOS
      const res = await fetch("/api/payos/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderCode: oc,
          amount:    finalAmount,
          description: `NCN ${oc}`,
          buyerName:  userName,
          buyerPhone: userPhone ?? "",
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Không thể tạo link thanh toán");

      const { bin, accountNumber, accountName, amount, description } = data.data;
      const bBin  = bin  || BANK_BIN;
      const bAcct = accountNumber || BANK_ACCT;
      const bName = accountName   || BANK_OWNER;
      const qrImgUrl = `https://img.vietqr.io/image/${bBin}-${bAcct}-compact2.png?amount=${amount ?? finalAmount}&addInfo=${encodeURIComponent(description ?? `NCN ${oc}`)}&accountName=${encodeURIComponent(bName)}`;

      setQrUrl(qrImgUrl);
      setQrDesc(description ?? `NCN ${oc}`);
      setPayStep("qr");

      // 3. Polling order status
      startPolling(oc);

    } catch (err: any) {
      setErrorMsg(err.message || "Có lỗi xảy ra, vui lòng thử lại");
      setPayStep("error");
    } finally {
      setIsCreatingOrder(false);
    }
  }

  const safeName = userName
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, "").trim()
    .replace(/\s+/g, "-");

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{ background: "#1e293b", color: "#fff" }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b"
          style={{ background: "#1e293b", borderColor: "rgba(255,255,255,0.1)" }}>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#E8A838" }}>
              MỞ KHÓA BÁO CÁO ĐẦY ĐỦ
            </p>
            <p className="text-sm font-black text-white mt-0.5">Bản đồ sự nghiệp cá nhân hóa</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* ── FORM ── */}
          {(payStep === "form" || payStep === "error") && (
            <>
              {/* Danh sách PDF */}
              <div className="rounded-xl p-4 space-y-2" style={{ background: "rgba(255,255,255,0.06)" }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#94a3b8" }}>
                  📄 BÁO CÁO BAO GỒM
                </p>
                {[
                  "5 nghề phù hợp nhất — phân tích chi tiết từng nghề",
                  "3 nghề nên tránh — và lý do cụ thể",
                  "Môi trường làm việc tối ưu cho tính cách của bạn",
                  "Lộ trình: ngành học → nghề nghiệp → mức thu nhập",
                  "Chiến lược phát triển sự nghiệp 5 năm tới",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "#2BA88C" }} />
                    <span className="text-sm text-white/80">{item}</span>
                  </div>
                ))}
              </div>

              {/* Giá */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-sm line-through" style={{ color: "rgba(255,255,255,0.4)" }}>
                    1.358.000đ
                  </span>
                  <span className="text-3xl font-black" style={{ color: "#E8A838" }}>
                    {finalAmount === 0 ? "MIỄN PHÍ" : PRICE_DISPLAY}
                  </span>
                </div>
                {couponOk && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full mt-2 inline-block"
                    style={{ background: "rgba(43,168,140,0.15)", color: "#2BA88C", border: "1px solid rgba(43,168,140,0.3)" }}>
                    Mã giảm giá đã áp dụng 🎉
                  </span>
                )}
              </div>

              {/* Coupon */}
              <div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#64748b" }} />
                    <input
                      type="text"
                      placeholder="Nhập mã ưu đãi (nếu có)"
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                      disabled={couponOk}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm border border-white/10 outline-none focus:border-amber-400/50 disabled:opacity-50"
                      style={{ background: "#0f172a", color: "#fff" }}
                    />
                  </div>
                  <button
                    onClick={handleApplyCoupon}
                    disabled={isApplyingCoupon || couponOk}
                    className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                    style={{ background: "#3b82f6", color: "#fff" }}
                  >
                    {isApplyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : "Áp dụng"}
                  </button>
                </div>
                {couponMsg && (
                  <p className={cn("text-xs mt-1.5", couponOk ? "text-emerald-400" : "text-red-400")}>
                    {couponMsg}
                  </p>
                )}
              </div>

              {/* Error */}
              {errorMsg && (
                <p className="text-sm text-red-400 bg-red-500/10 rounded-xl px-3 py-2">{errorMsg}</p>
              )}

              {/* CTA */}
              <button
                id="checkout-modal-cta"
                onClick={handleCreateOrder}
                disabled={isCreatingOrder}
                className="w-full py-4 rounded-xl font-black text-base flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70"
                style={{
                  background: "linear-gradient(135deg, #E8A838 0%, #f0c060 100%)",
                  color: "#1B2A4A",
                }}
              >
                {isCreatingOrder ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Đang xử lý...</>
                ) : finalAmount === 0 ? (
                  "🔓 NHẬN BÁO CÁO MIỄN PHÍ"
                ) : (
                  "🔓 THANH TOÁN QUA MÃ QR"
                )}
              </button>
              <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                Nhận file PDF trong 30 giây · Thanh toán bảo mật
              </p>
            </>
          )}

          {/* ── QR ── */}
          {payStep === "qr" && (
            <div className="text-center space-y-4">
              <div>
                <p className="font-bold text-lg text-white mb-1">Quét mã QR để thanh toán</p>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Số tiền:{" "}
                  <span className="font-bold text-white">{finalAmount.toLocaleString("vi-VN")} VNĐ</span>
                </p>
              </div>

              {qrUrl && (
                <div className="inline-block rounded-xl overflow-hidden border-4 border-white">
                  <img src={qrUrl} alt="QR thanh toán" className="w-56 h-56 object-contain" />
                </div>
              )}

              <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.06)" }}>
                <p className="text-xs mb-1" style={{ color: "#94a3b8" }}>Nội dung chuyển khoản:</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-bold text-white">{qrDesc}</span>
                  <button
                    onClick={() => navigator.clipboard?.writeText(qrDesc)}
                    className="opacity-60 hover:opacity-100 transition-opacity"
                  >
                    <Copy className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </div>

              <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                Hệ thống tự động nhận diện sau khi chuyển khoản.
                <br />Không cần xác nhận thủ công.
              </p>

              <div className="flex items-center justify-center gap-2 text-sm font-semibold" style={{ color: "#E8A838" }}>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang chờ thanh toán...
              </div>
            </div>
          )}

          {/* ── PROCESSING ── */}
          {payStep === "processing" && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                style={{ background: "rgba(43,168,140,0.15)", border: "2px solid #2BA88C" }}>
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#2BA88C" }} />
              </div>
              <p className="font-bold text-lg text-white">🎉 Đã nhận thanh toán!</p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                Hệ thống đang tạo báo cáo cá nhân hóa...<br />Vui lòng không đóng trang này.
              </p>
              <div className="h-1.5 rounded-full overflow-hidden mx-8" style={{ background: "rgba(255,255,255,0.1)" }}>
                <div className="h-full rounded-full animate-pulse" style={{ width: "70%", background: "#2BA88C" }} />
              </div>
            </div>
          )}

          {/* ── DONE ── */}
          {payStep === "done" && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                style={{ background: "rgba(43,168,140,0.15)", border: "2px solid #2BA88C" }}>
                <CheckCircle className="w-8 h-8" style={{ color: "#2BA88C" }} />
              </div>
              <p className="font-bold text-xl text-white">Báo cáo đã sẵn sàng! 🎉</p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                Báo cáo đã được tạo và gửi về email của bạn.
              </p>
              {pdfUrl && (
                <a
                  href={pdfUrl}
                  download={`Bao-Cao-NCN-${safeName}.pdf`}
                  className="inline-block py-4 px-8 rounded-xl font-black text-base transition-all hover:scale-105"
                  style={{ background: "linear-gradient(135deg, #2BA88C 0%, #1e8a72 100%)", color: "#fff" }}
                >
                  📥 LƯU BÁO CÁO VỀ MÁY
                </a>
              )}
              <button onClick={onClose} className="block w-full text-sm mt-2 hover:opacity-70 transition-opacity"
                style={{ color: "rgba(255,255,255,0.4)" }}>
                Đóng
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const RIASEC_NAMES: Record<string, string> = {
  R: "Thực Tế", I: "Nghiên Cứu", A: "Nghệ Thuật",
  S: "Xã Hội",  E: "Doanh Nhân", C: "Quy Củ",
};
const MBTI_TYPES: Record<string, string> = {
  INTJ:"Kiến Trúc Sư", INTP:"Nhà Tư Duy",  ENTJ:"Chỉ Huy",         ENTP:"Người Tranh Luận",
  INFJ:"Người Ủng Hộ", INFP:"Người Hòa Giải", ENFJ:"Nhân Vật Chính", ENFP:"Nhà Vận Động",
  ISTJ:"Nhà Logic",    ISFJ:"Người Bảo Vệ",   ESTJ:"Giám Thị",       ESFJ:"Lãnh Sự",
  ISTP:"Thợ Thủ Công", ISFP:"Nhà Thám Hiểm",  ESTP:"Doanh Nhân",     ESFP:"Người Giải Trí",
};

function buildPdfPayload(
  assessment: any,
  name: string,
  email?: string,
  phone?: string,
  avoidCareers: { title: string; reason: string }[] = [],
) {
  const riasec = assessment?.riasecResult ?? {};
  const careerResultRaw = assessment?.careerResult;
  const profile = careerResultRaw?.profile ?? {};
  const track = typeof careerResultRaw === "object" && !Array.isArray(careerResultRaw)
    ? (careerResultRaw.track ?? "university") : "university";

  const uniCareers: any[] = Array.isArray(careerResultRaw)
    ? careerResultRaw : (careerResultRaw?.university ?? []);
  const vocCareers: any[] = Array.isArray(careerResultRaw?.vocational)
    ? careerResultRaw.vocational : [];
  const activeCareers = track === "vocational" && vocCareers.length > 0 ? vocCareers : uniCareers;
  const top = activeCareers.slice(0, 5);

  const mbtiCode = riasec.mbtiCode ?? "ENFP";
  const hollandTop3 = riasec.top3 ?? "AIE";
  const hollandLabel = hollandTop3.split("").map((k: string) => `${k} – ${RIASEC_NAMES[k] ?? k}`).join(" | ");
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2,"0")}/${String(now.getMonth()+1).padStart(2,"0")}/${now.getFullYear()}`;

  return {
    HOTEN:    name || profile.fullName || "Học sinh NCN",
    NGAYSINH:  profile.birthDate ?? "",
    NGAY_SINH: profile.birthDate ?? "",
    EMAIL:    email || profile.email || "",
    PHONE:    phone || profile.phone || "",
    DIEN_THOAI: phone || profile.phone || "",
    TRACK:    track === "university" ? "Đại học / Cao đẳng" : "Học nghề",
    LOTRINHCHON: track === "university" ? "Học Đại Học / Cao Đẳng" : "Học Nghề – Đi Làm Luôn",
    NGAYTAO:  dateStr,
    NGAY_XUAT_BAN: dateStr,
    R_PCT: String(riasec.R ?? 0), I_PCT: String(riasec.I ?? 0),
    A_PCT: String(riasec.A ?? 0), S_PCT: String(riasec.S ?? 0),
    E_PCT: String(riasec.E ?? 0), C_PCT: String(riasec.C ?? 0),
    HOLLAND: hollandLabel,
    MBTI: mbtiCode,
    MBTI_TYPE: MBTI_TYPES[mbtiCode] ?? mbtiCode,
    LIFEPATH: String(riasec.numerology?.LP   ?? "—"),
    SOUL:     String(riasec.numerology?.soul ?? "—"),
    MISSION:  String(riasec.numerology?.mission ?? "—"),
    TALENT:   String(riasec.numerology?.talent ?? "—"),
    PASSION:  String(riasec.numerology?.passionNums?.[0] ?? "—"),
    TOP1_TITLE: top[0]?.name ?? "", TOP1_NICHE: top[0]?.niche ?? "", TOP1_PCT: String(top[0]?.pct ?? ""), TOP1_INDUSTRY: top[0]?.industry ?? "",
    TOP2_TITLE: top[1]?.name ?? "", TOP2_NICHE: top[1]?.niche ?? "", TOP2_PCT: String(top[1]?.pct ?? ""), TOP2_INDUSTRY: top[1]?.industry ?? "",
    TOP3_TITLE: top[2]?.name ?? "", TOP3_NICHE: top[2]?.niche ?? "", TOP3_PCT: String(top[2]?.pct ?? ""), TOP3_INDUSTRY: top[2]?.industry ?? "",
    TOP4_TITLE: top[3]?.name ?? "", TOP4_NICHE: top[3]?.niche ?? "", TOP4_PCT: String(top[3]?.pct ?? ""), TOP4_INDUSTRY: top[3]?.industry ?? "",
    TOP5_TITLE: top[4]?.name ?? "", TOP5_NICHE: top[4]?.niche ?? "", TOP5_PCT: String(top[4]?.pct ?? ""), TOP5_INDUSTRY: top[4]?.industry ?? "",
    MONHOC:      profile.favoriteSubjects   ?? "",
    HOATDONG:    profile.pastActivities     ?? "",
    GIADINHDINH: profile.familyOrientation  ?? "",
    BRAND_NAME:   "NCN Academy",
    REPORT_TITLE: "BÁO CÁO KHOA HỌC: ĐỊNH VỊ NĂNG LỰC HÀNH VI & BẢN ĐỒ CHIẾN LƯỢC SỰ NGHIỆP",
    // 3 nghề nên tránh
    AVOID_1_TITLE:  avoidCareers[0]?.title  ?? "",
    AVOID_1_REASON: avoidCareers[0]?.reason ?? "",
    AVOID_2_TITLE:  avoidCareers[1]?.title  ?? "",
    AVOID_2_REASON: avoidCareers[1]?.reason ?? "",
    AVOID_3_TITLE:  avoidCareers[2]?.title  ?? "",
    AVOID_3_REASON: avoidCareers[2]?.reason ?? "",
  };
}
