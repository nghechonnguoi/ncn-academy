"use client";

import { BarChart, TrendingUp, MessageSquare, Award } from "lucide-react";

interface StatsCardsProps {
  assessment: any;
}

export function StatsCards({ assessment }: StatsCardsProps) {
  const riasec = assessment?.riasecResult;
  const topCode = riasec?.top3 ?? "—";
  const topScore = riasec ? Math.max(riasec.R, riasec.I, riasec.A, riasec.S, riasec.E, riasec.C) : null;
  const careerCount = assessment?.careerResult?.length ?? 0;

  const stats = [
    {
      icon: BarChart,
      label: "Mã RIASEC",
      value: topCode,
      sub: riasec ? `Điểm cao nhất: ${topScore}%` : "Chưa làm bài test",
      color: "bg-violet-100 text-violet-600",
    },
    {
      icon: TrendingUp,
      label: "Nghề phù hợp",
      value: careerCount > 0 ? `${careerCount} nghề` : "—",
      sub: careerCount > 0 ? "Xem chi tiết bên dưới" : "Làm bài test để khám phá",
      color: "bg-blue-100 text-blue-600",
    },
    {
      icon: MessageSquare,
      label: "AI Advisor",
      value: "Sẵn sàng",
      sub: "Tư vấn nghề nghiệp 24/7",
      color: "bg-emerald-100 text-emerald-600",
    },
    {
      icon: Award,
      label: "Gói dịch vụ",
      value: "FREE",
      sub: "Nâng cấp để mở báo cáo PDF",
      color: "bg-orange-100 text-orange-600",
    },
  ];

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-5 flex gap-4 items-start">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400 font-medium">{s.label}</p>
              <p className="font-black text-gray-900 text-lg leading-tight truncate">{s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
