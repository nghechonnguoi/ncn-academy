"use client";

import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { MobileSidebarTrigger } from "@/components/dashboard/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Copy, Check, TrendingUp, Users, DollarSign, Link2, ArrowRight, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { affiliateApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { formatVND } from "@/lib/utils";

export default function AffiliatePage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const affiliateCode = stats?.affiliateCode ?? user?.affiliateCode ?? null;
  const affiliateLink = affiliateCode
    ? `https://nghechonnguoi.com/ref/${affiliateCode}`
    : "";

  useEffect(() => {
    Promise.all([
      affiliateApi.getStats().catch(() => null),
      affiliateApi.getCommissions().catch(() => []),
    ]).then(([s, c]) => {
      setStats(s);
      setCommissions(c ?? []);
    }).finally(() => setIsLoading(false));
  }, []);

  const handleCopy = () => {
    if (!affiliateLink) return;
    // clipboard API cần HTTPS; dùng fallback execCommand nếu fail
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(affiliateLink).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => fallbackCopy());
    } else {
      fallbackCopy();
    }
  };

  const fallbackCopy = () => {
    const el = document.createElement('textarea');
    el.value = affiliateLink;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // API returns { data, total, page, limit } — unwrap
  const commissionList = Array.isArray(commissions) ? commissions : (commissions as any)?.data ?? [];

  // Build chart data from commissions grouped by month
  const chartData = commissionList.reduce((acc: any[], c: any) => {
    const month = new Date(c.createdAt).toLocaleDateString("vi-VN", { month: "short" });
    const existing = acc.find((d) => d.month === month);
    if (existing) existing.amount += c.amount;
    else acc.push({ month, amount: c.amount });
    return acc;
  }, []).slice(-6);

  const totalEarned = stats?.totalPaid ?? 0;
  const pendingAmount = stats?.pendingAmount ?? 0;
  const referralCount = stats?.totalReferrals ?? 0;
  const conversionRate = referralCount > 0 ? Math.min((commissions.filter((c: any) => c.status === 'PAID').length / referralCount) * 100, 100) : 0;

  return (
    <div className="flex h-screen bg-gray-50">
      <DashboardSidebar />
      <div className="flex-1 overflow-y-auto">
        {/* Mobile top bar */}
        <div className="lg:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
          <MobileSidebarTrigger />
          <span className="font-bold text-gray-900 text-sm">Affiliate</span>
        </div>
        <div className="p-6 lg:p-8 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-2xl font-black text-gray-900">Chương Trình Affiliate</h1>
              <p className="text-gray-500 text-sm mt-1">Giới thiệu bạn bè và nhận 20% hoa hồng mỗi đơn hàng</p>
            </div>
            <Badge className="bg-green-100 text-green-700 border-green-200 px-3 py-1.5 font-semibold">
              ✅ Đang hoạt động
            </Badge>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-gray-400 gap-3">
              <Loader2 className="w-5 h-5 animate-spin" />
              Đang tải dữ liệu...
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Tổng hoa hồng", value: formatVND(totalEarned), icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
                  { label: "Người giới thiệu", value: `${referralCount} người`, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                  { label: "Tỷ lệ chuyển đổi", value: `${conversionRate.toFixed(1)}%`, icon: TrendingUp, color: "text-ncn-purple", bg: "bg-ncn-purple/10" },
                  { label: "Đang chờ duyệt", value: formatVND(pendingAmount), icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50" },
                ].map((s, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                      <s.icon className={`w-4 h-4 ${s.color}`} />
                    </div>
                    <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-3 gap-6 mb-8">
                {/* Affiliate link + chart */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-ncn-purple" />
                    Link giới thiệu của bạn
                  </h2>
                  <div className="flex gap-2">
                    <Input
                      value={affiliateCode ? affiliateLink : (isLoading ? "Đang tải..." : "Chưa có mã affiliate")}
                      readOnly
                      className="rounded-xl bg-gray-50 text-sm font-mono border-gray-200"
                    />
                    <Button
                      onClick={handleCopy}
                      disabled={!affiliateCode}
                      className={`rounded-xl px-4 flex-shrink-0 text-white ${copied ? "bg-green-500 hover:bg-green-600" : "bg-ncn-purple hover:bg-ncn-purple-dark"}`}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <a
                      href="https://zalo.me/g/lilbiycoxygz5arb5bj2"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80 border"
                      style={{ background: "rgba(0,120,200,0.08)", color: "#0078C8", borderColor: "rgba(0,120,200,0.25)", textDecoration: "none" }}
                      title="Tham gia nhóm Zalo Affiliate NCN"
                    >
                      <svg width="15" height="15" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="48" height="48" rx="10" fill="#0078C8"/>
                        <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="26" fontWeight="bold" fontFamily="Arial">Z</text>
                      </svg>
                      Zalo
                    </a>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Mã: <strong className="text-gray-600">{affiliateCode ?? "—"}</strong> · Hoa hồng: <strong className="text-green-600">20%</strong> mỗi đơn
                  </p>
                  {/* Zalo community */}
                  <a
                    href="https://zalo.me/g/lilbiycoxygz5arb5bj2"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-3 text-sm font-semibold transition-opacity hover:opacity-80"
                    style={{ color: "#0078C8", textDecoration: "none" }}
                  >
                    <svg width="18" height="18" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="48" height="48" rx="10" fill="#0078C8"/>
                      <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="26" fontWeight="bold" fontFamily="Arial">Z</text>
                    </svg>
                    Tham gia nhóm Zalo Affiliate NCN Academy
                  </a>


                  {chartData.length > 0 && (
                    <div className="mt-6">
                      <p className="text-sm font-semibold text-gray-700 mb-4">Hoa hồng theo tháng</p>
                      <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={chartData} barSize={24}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false}
                            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                          <Tooltip
                            formatter={(v: number) => [`${v.toLocaleString("vi-VN")}đ`, "Hoa hồng"]}
                            contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                          />
                          <Bar dataKey="amount" fill="#635bff" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {chartData.length === 0 && (
                    <div className="mt-6 text-center py-8 text-gray-400 text-sm">
                      Chưa có hoa hồng nào. Hãy chia sẻ link để bắt đầu kiếm tiền! 🚀
                    </div>
                  )}
                </div>

                {/* Payout */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="font-bold text-gray-900 mb-4">Rút tiền</h2>
                  <div className="bg-ncn-purple/5 rounded-xl p-4 mb-4">
                    <p className="text-xs text-gray-500">Số dư khả dụng</p>
                    <p className="text-2xl font-black text-ncn-purple mt-0.5">{formatVND(totalEarned - pendingAmount)}</p>
                  </div>
                  <div className="space-y-3 mb-4">
                    <Input placeholder="Tên ngân hàng" className="rounded-xl text-sm" />
                    <Input placeholder="Số tài khoản" className="rounded-xl text-sm" />
                    <Input placeholder="Số tiền rút (đ)" className="rounded-xl text-sm" />
                  </div>
                  <Button className="w-full bg-ncn-purple hover:bg-ncn-purple-dark rounded-xl font-semibold">
                    Yêu cầu rút tiền
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                  <p className="text-xs text-gray-400 text-center mt-3">Xử lý trong 1–3 ngày làm việc</p>
                </div>
              </div>

              {/* Commissions table */}
              {commissionList.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <h2 className="font-bold text-gray-900">Lịch sử hoa hồng</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {["Người dùng", "Hoa hồng", "Ngày", "Trạng thái"].map((h) => (
                            <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {commissionList.map((c: any) => (
                          <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                            <td className="px-5 py-3.5 font-medium text-gray-900">{c.referredUserId?.slice(0, 8)}...</td>
                            <td className="px-5 py-3.5 font-semibold text-green-600">{formatVND(c.amount)}</td>
                            <td className="px-5 py-3.5 text-gray-400">{new Date(c.createdAt).toLocaleDateString("vi-VN")}</td>
                            <td className="px-5 py-3.5">
                              <Badge className={c.status === "PAID" ? "bg-green-100 text-green-700 border-0" : "bg-amber-100 text-amber-700 border-0"}>
                                {c.status === "PAID" ? "Đã thanh toán" : "Đang xử lý"}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {commissionList.length === 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-400 text-sm">
                  Chưa có giao dịch nào. Chia sẻ link affiliate để bắt đầu!
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
