"use client";

import Link from "next/link";
import { ArrowRight, Loader2, Trophy, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CareerResultsProps {
  assessment: any;
  isLoading: boolean;
}

const RIASEC_COLORS: Record<string, string> = {
  R: "bg-amber-500", I: "bg-blue-500", A: "bg-pink-500",
  S: "bg-green-500", E: "bg-orange-500", C: "bg-violet-500",
};

const RIASEC_LABELS: Record<string, string> = {
  R: "Thực Tế", I: "Nghiên Cứu", A: "Nghệ Thuật",
  S: "Xã Hội", E: "Doanh Nhân", C: "Quy Củ",
};

export function CareerResults({ assessment, isLoading }: CareerResultsProps) {
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
        <p className="text-gray-500 text-sm mb-6">Làm bài test RIASEC 60 câu để khám phá TOP 5 nghề nghiệp phù hợp nhất với bạn.</p>
        <Link href="/assessment">
          <Button className="bg-[#635bff] hover:bg-[#5248e8] text-white rounded-xl">
            Bắt đầu bài test
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </Link>
      </div>
    );
  }

  const careers = assessment.careerResult ?? [];
  const riasec = assessment.riasecResult ?? {};

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-black text-gray-900">Kết Quả Phân Tích RIASEC</h2>
            <p className="text-xs text-gray-400 mt-0.5">Mã nhóm: <strong className="text-[#635bff]">{riasec.top3}</strong></p>
          </div>
          <Link href="/assessment">
            <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Làm lại
            </Button>
          </Link>
        </div>

        {/* RIASEC Bars */}
        <div className="grid grid-cols-6 gap-2">
          {(["R", "I", "A", "S", "E", "C"] as const).map((key) => (
            <div key={key} className="text-center">
              <div className="h-16 bg-gray-50 rounded-lg relative overflow-hidden flex items-end">
                <div
                  className={cn("w-full rounded-b-lg transition-all duration-700", RIASEC_COLORS[key])}
                  style={{ height: `${riasec[key] ?? 0}%` }}
                />
              </div>
              <p className="text-xs font-bold text-gray-700 mt-1">{key}</p>
              <p className="text-xs text-gray-400">{riasec[key] ?? 0}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Career List */}
      <div className="divide-y divide-gray-50">
        {careers.map((career: any) => (
          <div key={career.name} className="p-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-black flex-shrink-0",
              career.rank === 1 ? "bg-[#635bff]" : "bg-gray-200 text-gray-500"
            )}>
              {career.rank}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900 text-sm">{career.name}</p>
                <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-mono">{career.riasec}</span>
              </div>
              <p className="text-xs text-gray-400">{career.niche}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#635bff] rounded-full"
                  style={{ width: `${career.pct}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{career.pct}% phù hợp</p>
            </div>
            <div className="text-right flex-shrink-0 hidden sm:block">
              <p className="text-xs font-semibold text-emerald-600">{career.salary}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
