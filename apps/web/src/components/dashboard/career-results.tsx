"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Briefcase, GraduationCap, Loader2, TrendingUp, Trophy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ExportReportButton } from "@/components/dashboard/export-report-button";

interface CareerResultsProps {
  assessment: any;
  isLoading: boolean;
}

// Màu sắc và tên tiếng Việt cho từng nhóm tính cách
const RIASEC_COLORS: Record<string, string> = {
  R: "bg-amber-500", I: "bg-blue-500", A: "bg-pink-500",
  S: "bg-green-500", E: "bg-orange-500", C: "bg-violet-500",
};

const RIASEC_LABELS: Record<string, string> = {
  R: "Thực Tế", I: "Nghiên Cứu", A: "Nghệ Thuật",
  S: "Xã Hội",  E: "Doanh Nhân", C: "Quy Củ",
};

const INDUSTRY_COLORS: Record<string, string> = {
  "Cơ khí – Kỹ thuật chế tạo":        "bg-orange-100 text-orange-700",
  "Điện – Điện lạnh – Điện tử":        "bg-blue-100 text-blue-700",
  "Công nghệ thông tin – Kỹ thuật số": "bg-purple-100 text-purple-700",
  "Ô tô – Xe máy":                     "bg-slate-100 text-slate-700",
  "Xây dựng – Nội thất":               "bg-amber-100 text-amber-700",
  "Ẩm thực – Nhà hàng – Khách sạn":    "bg-red-100 text-red-700",
  "Làm đẹp – Chăm sóc cá nhân":        "bg-pink-100 text-pink-700",
  "Y tế – Chăm sóc sức khỏe":          "bg-emerald-100 text-emerald-700",
  "Nông nghiệp – Thủy sản":            "bg-lime-100 text-lime-700",
  "Vận tải – Logistics":               "bg-cyan-100 text-cyan-700",
  "Bán hàng – Kinh doanh":             "bg-yellow-100 text-yellow-700",
  "Du lịch – Sự kiện":                 "bg-teal-100 text-teal-700",
  "Nghệ thuật – Giải trí":             "bg-fuchsia-100 text-fuchsia-700",
  "Thể thao – Fitness":                "bg-green-100 text-green-700",
  "Hàng không – Sân bay":              "bg-sky-100 text-sky-700",
};

function getIndustryColor(industry: string) {
  return INDUSTRY_COLORS[industry] ?? "bg-gray-100 text-gray-600";
}

// Chuyển mã RIASEC (vd: "RIC") thành nhãn tiếng Việt (vd: "Thực Tế · Nghiên Cứu · Quy Củ")
function riasecToLabel(code: string) {
  return code.split("").map((c) => RIASEC_LABELS[c] ?? c).join(" · ");
}

export function CareerResults({ assessment, isLoading }: CareerResultsProps) {
  const [activeTab, setActiveTab] = useState<"university" | "vocational">("vocational");

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 flex items-center justify-center gap-3 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Đang tải kết quả...</span>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-violet-400" />
        </div>
        <h3 className="font-bold text-gray-900 mb-2">Chưa có kết quả phân tích</h3>
        <p className="text-gray-500 text-sm mb-6">
          Làm bài test 60 câu để khám phá những nghề nghiệp phù hợp nhất với tính cách và thế mạnh của bạn.
        </p>
        <Link href="/assessment">
          <Button className="bg-[#635bff] hover:bg-[#5248e8] text-white rounded-xl">
            Bắt đầu bài test
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </Link>
      </div>
    );
  }

  const riasec = assessment.riasecResult ?? {};

  // Hỗ trợ cả format cũ (flat) và mới (nested)
  const careerResultRaw = assessment.careerResult;
  const track: string =
    (typeof careerResultRaw === "object" && careerResultRaw !== null && !Array.isArray(careerResultRaw) && careerResultRaw.track)
      ? careerResultRaw.track
      : "university";

  const universityCareers: any[] =
    Array.isArray(careerResultRaw)
      ? careerResultRaw
      : careerResultRaw?.university ?? [];

  const vocationalCareers: any[] =
    Array.isArray(careerResultRaw?.vocational)
      ? careerResultRaw.vocational
      : [];

  const isVocational = track === "vocational" && vocationalCareers.length > 0;

  // Lĩnh vực nổi bật (không trùng lặp)
  const topIndustries = isVocational
    ? [...new Set(vocationalCareers.map((c: any) => c.industry))]
    : [];

  const effectiveTab = isVocational ? activeTab : "university";

  // Top 3 tính cách nổi trội của người dùng
  const top3Label = riasec.top3
    ? riasec.top3.split("").map((k: string) => RIASEC_LABELS[k] ?? k).join(" – ")
    : "";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">

      {/* ── Header: Biểu đồ tính cách ── */}
      <div className="p-6 border-b border-gray-50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-black text-gray-900">Kết Quả Phân Tích Tính Cách</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Nhóm nổi trội: <strong className="text-[#635bff]">{top3Label}</strong>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportReportButton assessment={assessment} />
            <Link href="/assessment">
              <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                Làm lại
              </Button>
            </Link>
          </div>
        </div>

        {/* Biểu đồ 6 nhóm tính cách */}
        <div className="grid grid-cols-6 gap-2">
          {(["R", "I", "A", "S", "E", "C"] as const).map((key) => (
            <div key={key} className="text-center">
              <div className="h-16 bg-gray-50 rounded-lg relative overflow-hidden flex items-end">
                <div
                  className={cn("w-full rounded-b-lg transition-all duration-700", RIASEC_COLORS[key])}
                  style={{ height: `${riasec[key] ?? 0}%` }}
                />
              </div>
              <p className="text-xs font-bold text-gray-700 mt-1">{RIASEC_LABELS[key]}</p>
              <p className="text-xs text-gray-400">{riasec[key] ?? 0}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab chuyển đổi: Học nghề / Đại học ── */}
      {isVocational && (
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab("vocational")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors",
              effectiveTab === "vocational"
                ? "text-[#635bff] border-b-2 border-[#635bff] bg-violet-50/50"
                : "text-gray-400 hover:text-gray-600"
            )}
          >
            <Briefcase className="w-4 h-4" />
            Học Nghề – Đi Làm Luôn
          </button>
          <button
            onClick={() => setActiveTab("university")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors",
              effectiveTab === "university"
                ? "text-[#635bff] border-b-2 border-[#635bff] bg-violet-50/50"
                : "text-gray-400 hover:text-gray-600"
            )}
          >
            <GraduationCap className="w-4 h-4" />
            Học Đại Học
          </button>
        </div>
      )}

      {/* ── Danh sách nghề: Học nghề ── */}
      {effectiveTab === "vocational" && isVocational ? (
        <div>
          {/* Lĩnh vực phù hợp */}
          {topIndustries.length > 0 && (
            <div className="px-4 py-3 bg-violet-50/30 border-b border-gray-50 flex flex-wrap gap-1.5">
              <span className="text-xs text-gray-500 font-medium self-center">Lĩnh vực:</span>
              {topIndustries.map((ind) => (
                <span
                  key={ind}
                  className={cn("text-xs px-2 py-0.5 rounded-full font-medium", getIndustryColor(ind))}
                >
                  {ind}
                </span>
              ))}
            </div>
          )}

          <div className="divide-y divide-gray-50">
            {vocationalCareers.map((career: any) => (
              <div key={career.name} className="p-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                {/* Hạng */}
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-black flex-shrink-0",
                  career.rank === 1 ? "bg-[#635bff]" : career.rank <= 3 ? "bg-violet-400" : "bg-gray-200 text-gray-500"
                )}>
                  {career.rank}
                </div>

                {/* Tên nghề + thông tin */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 text-sm">{career.name}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <p className="text-xs text-gray-400">{career.niche}</p>
                    <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium", getIndustryColor(career.industry))}>
                      {career.industry}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">⏱ Thời gian học: {career.trainingTime}</p>
                </div>

                {/* Mức độ phù hợp + Thu nhập */}
                <div className="text-right flex-shrink-0">
                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#635bff] rounded-full"
                      style={{ width: `${career.pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{career.pct}% phù hợp</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      ) : (
        /* ── Danh sách nghề: Đại học ── */
        <div className="divide-y divide-gray-50">
          {universityCareers.map((career: any) => (
            <div key={career.name} className="p-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
              {/* Hạng */}
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-black flex-shrink-0",
                career.rank === 1 ? "bg-[#635bff]" : "bg-gray-200 text-gray-500"
              )}>
                {career.rank}
              </div>

              {/* Tên nghề */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{career.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{career.niche}</p>
              </div>

              {/* Mức độ phù hợp */}
              <div className="text-right flex-shrink-0">
                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#635bff] rounded-full"
                    style={{ width: `${career.pct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{career.pct}% phù hợp</p>
              </div>


            </div>
          ))}
        </div>
      )}
    </div>
  );
}
