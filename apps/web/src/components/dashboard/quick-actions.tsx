import Link from "next/link";
import { Bot, Route, ArrowRight, ClipboardList } from "lucide-react";

interface QuickActionsProps {
  hasAssessment?: boolean;
}

export function QuickActions({ hasAssessment }: QuickActionsProps) {
  const actions = [
    {
      icon: ClipboardList,
      label: hasAssessment ? "Làm lại bài test" : "Làm bài test ngay",
      href: "/assessment",
      color: "text-violet-600 bg-violet-50",
    },
    { icon: Bot, label: "Chat với Chuyên gia ảo", href: "/ai-tools", color: "text-[#635bff] bg-[#635bff]/10" },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-bold text-gray-900 text-sm mb-4">Hành động nhanh</h3>
      <div className="space-y-2">
        {actions.map((a) => (
          <Link key={a.href} href={a.href}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${a.color} flex items-center justify-center`}>
                <a.icon size={15} />
              </div>
              <span className="text-sm font-medium text-gray-700">{a.label}</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
