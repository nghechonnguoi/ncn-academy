"use client";

import type { Metadata } from "next";
import { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { CareerResults } from "@/components/dashboard/career-results";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { useAuth } from "@/hooks/useAuth";
import { assessmentApi } from "@/lib/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [latestAssessment, setLatestAssessment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    assessmentApi.list()
      .then((list) => { 
        // Lọc bỏ kết quả cũ (trước ngày 05/07/2026)
        const resetDate = new Date('2026-07-05T00:00:00.000Z');
        const validAssessments = list.filter((a: any) => new Date(a.createdAt) >= resetDate);
        if (validAssessments.length > 0) {
          setLatestAssessment(validAssessments[0]); 
        } else {
          setLatestAssessment(null);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const firstName = user?.name?.split(" ").pop() ?? "bạn";

  return (
    <div className="flex h-screen bg-gray-50">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Welcome */}
            <div>
              <h1 className="text-2xl font-black text-gray-900">
                Chào mừng trở lại, {firstName} 👋
              </h1>
              <p className="text-gray-500 mt-1 text-sm">
                Hôm nay là ngày tốt để khám phá thêm về sự nghiệp của bạn.
              </p>
            </div>

            {/* No assessment CTA */}
            {!isLoading && !latestAssessment && (
              <div className="bg-gradient-to-r from-[#635bff] to-[#7c3aed] rounded-2xl p-6 text-white flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-lg mb-1">Bạn chưa làm bài test RIASEC</h2>
                  <p className="text-violet-200 text-sm">Làm bài test 5 phút để khám phá TOP 5 nghề phù hợp nhất với bạn.</p>
                </div>
                <Link href="/assessment">
                  <Button className="bg-white text-[#635bff] hover:bg-violet-50 rounded-xl font-semibold gap-2 flex-shrink-0">
                    Bắt đầu ngay
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            )}

            {/* Stats */}
            <StatsCards assessment={latestAssessment} />

            {/* Main Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <CareerResults assessment={latestAssessment} isLoading={isLoading} />
              </div>
              <div className="space-y-6">
                <QuickActions hasAssessment={!!latestAssessment} />
                <RecentActivity />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
