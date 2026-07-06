"use client";

import { useState } from "react";
import { FileText, Loader2, Download, Mail, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ExportReportButtonProps {
  assessment: any;
  className?: string;
}

const RIASEC_NAMES: Record<string, string> = {
  R: "Thực Tế", I: "Nghiên Cứu", A: "Nghệ Thuật",
  S: "Xã Hội",  E: "Doanh Nhân", C: "Quy Củ",
};

const MBTI_TYPES: Record<string, string> = {
  INTJ:"Kiến Trúc Sư", INTP:"Nhà Tư Duy", ENTJ:"Chỉ Huy", ENTP:"Người Tranh Luận",
  INFJ:"Người Ủng Hộ", INFP:"Người Hòa Giải", ENFJ:"Nhân Vật Chính", ENFP:"Nhà Vận Động",
  ISTJ:"Nhà Logic", ISFJ:"Người Bảo Vệ", ESTJ:"Giám Thị", ESFJ:"Lãnh Sự",
  ISTP:"Thợ Thủ Công", ISFP:"Nhà Thám Hiểm", ESTP:"Doanh Nhân", ESFP:"Người Giải Trí",
};

export function ExportReportButton({ assessment, className }: ExportReportButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (!assessment) return null;

  const riasec = assessment.riasecResult ?? {};
  const careerResultRaw = assessment.careerResult;
  const profile = careerResultRaw?.profile ?? {};

  const track: string =
    typeof careerResultRaw === "object" && !Array.isArray(careerResultRaw)
      ? (careerResultRaw.track ?? "university")
      : "university";

  const uniCareers: any[] = Array.isArray(careerResultRaw)
    ? careerResultRaw
    : (careerResultRaw?.university ?? []);

  const vocCareers: any[] = Array.isArray(careerResultRaw?.vocational)
    ? careerResultRaw.vocational
    : [];

  const activeCareers = track === "vocational" && vocCareers.length > 0 ? vocCareers : uniCareers;

  const mbtiCode: string = riasec.mbtiCode ?? "ENFP";
  const hollandTop3 = riasec.top3 ?? "AIE";
  const hollandLabel = hollandTop3
    .split("")
    .map((k: string) => `${k} – ${RIASEC_NAMES[k] ?? k}`)
    .join(" | ");

  const handleExport = async () => {
    setStatus("loading");
    setErrorMsg("");

    // Tên đẹp cho file
    const safeName = (profile.fullName ?? "hoc-sinh")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9\s]/g, "").trim()
      .replace(/\s+/g, "-");

    // Build data object cho template
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2,"0")}/${String(now.getMonth()+1).padStart(2,"0")}/${now.getFullYear()}`;

    const topCareers = activeCareers.slice(0, 5);

    const payload: Record<string, string> = {
      HOTEN:    profile.fullName  ?? "Học sinh NCN",
      NGAYSINH: profile.birthDate ?? "Chưa cung cấp",
      EMAIL:    profile.email     ?? "Không cung cấp",
      PHONE:    profile.phone     ?? "Chưa cung cấp",
      TRACK:    track === "university" ? "Đại học / Cao đẳng" : "Học nghề",
      LOTRINHCHON: track === "university" ? "Học Đại Học / Cao Đẳng" : "Học Nghề – Đi Làm Luôn",
      NGAYTAO:  dateStr,

      // RIASEC %
      R_PCT: String(riasec.R ?? 0),
      I_PCT: String(riasec.I ?? 0),
      A_PCT: String(riasec.A ?? 0),
      S_PCT: String(riasec.S ?? 0),
      E_PCT: String(riasec.E ?? 0),
      C_PCT: String(riasec.C ?? 0),
      HOLLAND: hollandLabel,

      // MBTI
      MBTI:       mbtiCode,
      MBTI_TYPE:  MBTI_TYPES[mbtiCode] ?? mbtiCode,

      // Nhân số (nếu có)
      LIFEPATH: String(riasec.numerology?.LP   ?? "—"),
      SOUL:     String(riasec.numerology?.soul ?? "—"),
      MISSION:  String(riasec.numerology?.mission ?? "—"),
      TALENT:   String(riasec.numerology?.talent ?? "—"),
      PASSION:  String(riasec.numerology?.passionNums?.[0] ?? "—"),

      // Top 5 nghề
      TOP1_TITLE: topCareers[0]?.name ?? "",
      TOP1_NICHE: topCareers[0]?.niche ?? "",
      TOP1_PCT:   String(topCareers[0]?.pct ?? ""),
      TOP2_TITLE: topCareers[1]?.name ?? "",
      TOP2_NICHE: topCareers[1]?.niche ?? "",
      TOP2_PCT:   String(topCareers[1]?.pct ?? ""),
      TOP3_TITLE: topCareers[2]?.name ?? "",
      TOP3_NICHE: topCareers[2]?.niche ?? "",
      TOP3_PCT:   String(topCareers[2]?.pct ?? ""),
      TOP4_TITLE: topCareers[3]?.name ?? "",
      TOP4_NICHE: topCareers[3]?.niche ?? "",
      TOP4_PCT:   String(topCareers[3]?.pct ?? ""),
      TOP5_TITLE: topCareers[4]?.name ?? "",
      TOP5_NICHE: topCareers[4]?.niche ?? "",
      TOP5_PCT:   String(topCareers[4]?.pct ?? ""),

      // Profile context
      MONHOC:     profile.favoriteSubjects ?? "",
      HOATDONG:   profile.pastActivities  ?? "",
      GIADINHDINH: profile.familyOrientation ?? "",

      // Thương hiệu
      BRAND_NAME:   "NCN Academy",
      REPORT_TITLE: "BÁO CÁO KHOA HỌC: ĐỊNH VỊ NĂNG LỰC HÀNH VI & BẢN ĐỒ CHIẾN LƯỢC SỰ NGHIỆP",
    };

    try {
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? `HTTP ${res.status}`);
      }

      const contentType = res.headers.get("content-type") ?? "";

      if (contentType.includes("application/pdf")) {
        // Direct buffer response (free tier)
        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href     = url;
        a.download = `Bao-Cao-NCN-${safeName}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        setStatus("success");
      } else {
        // JSON response — có thể có pdfBase64
        const json = await res.json();
        if (json.pdfBase64) {
          const byteArr = Uint8Array.from(atob(json.pdfBase64), c => c.charCodeAt(0));
          const blob    = new Blob([byteArr], { type: "application/pdf" });
          const url     = URL.createObjectURL(blob);
          const a       = document.createElement("a");
          a.href        = url;
          a.download    = `Bao-Cao-NCN-${safeName}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
          setStatus("success");
        } else if (json.success) {
          // Email đã được gửi
          setStatus("success");
        } else {
          throw new Error(json.error ?? "Không thể xuất báo cáo");
        }
      }
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message ?? "Có lỗi xảy ra khi tạo báo cáo PDF");
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Button
        onClick={handleExport}
        disabled={status === "loading"}
        className={cn(
          "w-full gap-2 h-11 rounded-xl font-semibold text-sm transition-all",
          status === "success"
            ? "bg-emerald-500 hover:bg-emerald-600 text-white"
            : status === "error"
              ? "bg-red-50 border border-red-200 text-red-600 hover:bg-red-100"
              : "bg-[#635bff] hover:bg-[#5248e8] text-white"
        )}
      >
        {status === "loading" ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Đang tạo báo cáo...</>
        ) : status === "success" ? (
          <><CheckCircle className="w-4 h-4" /> Xuất thành công!</>
        ) : status === "error" ? (
          <><AlertCircle className="w-4 h-4" /> Thử lại</>
        ) : (
          <><FileText className="w-4 h-4" /> Xuất báo cáo PDF</>
        )}
      </Button>

      {status === "loading" && (
        <div className="flex items-start gap-2 bg-violet-50 rounded-xl px-3 py-2.5">
          <div className="flex flex-col gap-1 w-full">
            <p className="text-xs font-semibold text-[#635bff]">Đang tạo báo cáo...</p>
            <div className="flex gap-1.5 items-center text-xs text-gray-400">
              <Mail className="w-3 h-3" />
              Báo cáo sẽ được tải xuống và gửi qua email nếu có.
            </div>
            <div className="w-full h-1 bg-violet-100 rounded-full mt-1.5 overflow-hidden">
              <div className="h-full bg-[#635bff] rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        </div>
      )}

      {status === "success" && (
        <div className="flex items-center gap-2 bg-emerald-50 rounded-xl px-3 py-2 text-xs text-emerald-700">
          <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Báo cáo đã được tải xuống. Kiểm tra thư mục Downloads.</span>
        </div>
      )}

      {status === "error" && (
        <div className="bg-red-50 rounded-xl px-3 py-2 text-xs text-red-600">
          <div className="flex items-center gap-1.5 font-semibold mb-0.5">
            <AlertCircle className="w-3.5 h-3.5" /> Không thể tạo báo cáo
          </div>
          <p className="text-red-500">{errorMsg}</p>
        </div>
      )}
    </div>
  );
}
