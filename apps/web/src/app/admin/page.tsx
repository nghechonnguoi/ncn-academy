"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  DollarSign,
  TrendingUp,
  FileText,
  Search,
  MoreHorizontal,
  Download,
  Settings,
  ShieldAlert,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  HandCoins,
  ChevronDown,
  Ticket,
  Plus,
  Trash2,
  Tag,
  Mail,
  Send,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AffiliateRow {
  referralCode: string;
  name: string;
  phone: string;
  bankAccount: string;
  bankName: string;
  lifetimeOrders: number;
  tierName: string;
  commissionRate: number;
  monthOrderCount: number;
  monthRevenue: number;
  commissionOwed: number;
  payoutContent: string;
}

const revenueData = [
  { date: "T1", revenue: 2500000, users: 12 },
  { date: "T2", revenue: 4200000, users: 19 },
  { date: "T3", revenue: 3800000, users: 17 },
  { date: "T4", revenue: 6100000, users: 28 },
  { date: "T5", revenue: 5500000, users: 25 },
  { date: "T6", revenue: 8900000, users: 38 },
];

const planDist = [
  { name: "Free", value: 65, color: "#e5e7eb" },
  { name: "Pro", value: 30, color: "#635bff" },
  { name: "Enterprise", value: 5, color: "#0ea5e9" },
];

const users = [
  {
    id: "1",
    name: "Nguyễn Văn An",
    email: "an@gmail.com",
    plan: "Pro",
    status: "active",
    joined: "01/06/2026",
    revenue: "299.000đ",
  },
  {
    id: "2",
    name: "Trần Thị Bình",
    email: "binh@gmail.com",
    plan: "Free",
    status: "active",
    joined: "05/06/2026",
    revenue: "0đ",
  },
  {
    id: "3",
    name: "Lê Minh Châu",
    email: "chau@gmail.com",
    plan: "Pro",
    status: "active",
    joined: "10/06/2026",
    revenue: "299.000đ",
  },
  {
    id: "4",
    name: "Phạm Đức Dũng",
    email: "dung@gmail.com",
    plan: "Free",
    status: "inactive",
    joined: "15/06/2026",
    revenue: "0đ",
  },
];

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<
    "overview" | "affiliate" | "coupons"
  >("overview");
  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.includes(search),
  );

  // ── Affiliate Report State ──────────────────────────────────────────────
  const now = new Date();
  const [affMonth, setAffMonth] = useState(now.getMonth() + 1);
  const [affYear, setAffYear] = useState(now.getFullYear());
  const [affData, setAffData] = useState<AffiliateRow[]>([]);
  const [affLoading, setAffLoading] = useState(false);
  const [affLoaded, setAffLoaded] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchAffReport = useCallback(async () => {
    setAffLoading(true);
    try {
      const res = await fetch(
        `/api/admin/affiliate-report?month=${affMonth}&year=${affYear}`,
      );
      const json = await res.json();
      if (json.success) setAffData(json.report);
    } catch {
    } finally {
      setAffLoading(false);
      setAffLoaded(true);
    }
  }, [affMonth, affYear]);

  useEffect(() => {
    if (activeTab === "affiliate" && !affLoaded) fetchAffReport();
  }, [activeTab, affLoaded, fetchAffReport]);

  const handleCopy = (text: string, code: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const totalCommission = affData.reduce((s, r) => s + r.commissionOwed, 0);

  // ── Coupon Management State ─────────────────────────────────────────────
  interface CouponRow {
    code: string;
    type: string;
    isAdmin: boolean;
    note: string;
    active: boolean;
    used: boolean;
    orderCode: string | null;
    usedAt: string | null;
  }
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponLoaded, setCouponLoaded] = useState(false);
  const [couponFilter, setCouponFilter] = useState<
    "ALL" | "USED" | "AVAILABLE"
  >("ALL");
  const [newCode, setNewCode] = useState("");
  const [newType, setNewType] = useState("FREE");
  const [newNote, setNewNote] = useState("");
  const [newAdmin, setNewAdmin] = useState(false);
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState("");

  // ── Send Report State ───────────────────────────────────────────────────
  const [sendReportLoading, setSendReportLoading] = useState(false);
  const [sendReportMsg, setSendReportMsg] = useState("");

  const handleSendReport = async (periodDays: number) => {
    setSendReportLoading(true);
    setSendReportMsg("");
    try {
      const res = await fetch("/api/admin/send-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodDays }),
      });
      const json = await res.json();
      if (json.success) {
        setSendReportMsg(`✅ Đã gửi! ${json.summary.orders} đơn · ${(json.summary.revenue / 1000).toFixed(0)}k đ · ${json.summary.affiliates} affiliate`);
      } else {
        setSendReportMsg(`❌ ${json.error || "Lỗi gửi email"}`);
      }
    } catch {
      setSendReportMsg("❌ Lỗi kết nối");
    } finally {
      setSendReportLoading(false);
      setTimeout(() => setSendReportMsg(""), 6000);
    }
  };

  const fetchCoupons = async () => {
    setCouponLoading(true);
    try {
      const res = await fetch("/api/admin/coupons");
      const json = await res.json();
      if (json.success) setCoupons(json.coupons);
    } catch {
    } finally {
      setCouponLoading(false);
      setCouponLoaded(true);
    }
  };

  useEffect(() => {
    if (activeTab === "coupons" && !couponLoaded) fetchCoupons();
  }, [activeTab, couponLoaded]);

  const handleAddCoupon = async () => {
    setAddError("");
    setAddLoading(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCode.toUpperCase().trim(),
          type: newType,
          isAdmin: newAdmin,
          note: newNote,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setNewCode("");
        setNewNote("");
        setNewAdmin(false);
        setCouponLoaded(false);
      } else {
        setAddError(json.error || "Lỗi tạo mã");
      }
    } catch {
      setAddError("Lỗi kết nối");
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    if (!confirm(`Xóa mã ${code}? Hành động này không thể hoàn tác.`)) return;
    setDeleteMsg("");
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = await res.json();
      if (json.success) {
        setCouponLoaded(false);
        setDeleteMsg(`✅ Đã xóa mã ${code}`);
      } else setDeleteMsg(`❌ ${json.error}`);
    } catch {
      setDeleteMsg("❌ Lỗi kết nối");
    }
    setTimeout(() => setDeleteMsg(""), 4000);
  };

  // --- Loading state ---

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-ncn-purple" />
      </div>
    );
  }

  // --- Unauthorised: not logged in or not ADMIN ---
  if (!user || user.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Truy cập bị từ chối
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            Bạn không có quyền truy cập trang quản trị. Chỉ tài khoản{" "}
            <strong>Admin</strong> mới được phép.
          </p>
          <Button
            onClick={() => router.push("/dashboard")}
            className="bg-ncn-purple hover:bg-ncn-purple-dark text-white rounded-xl"
          >
            Về Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 font-bold">
              <span className="w-8 h-8 rounded-lg bg-ncn-purple flex items-center justify-center text-white">
                🧭
              </span>
              <span>
                NCN<span className="text-ncn-purple">Admin</span>
              </span>
            </Link>
            <Badge className="bg-red-100 text-red-700 border-0 text-xs">
              ADMIN PANEL
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            {/* Send Report Button */}
            <div className="flex flex-col items-end gap-1">
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendReport(1)}
                  disabled={sendReportLoading}
                  className="rounded-xl gap-1.5 text-xs border-gray-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                  title="Gửi báo cáo hôm nay"
                >
                  {sendReportLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Báo cáo ngày
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSendReport(7)}
                  disabled={sendReportLoading}
                  className="rounded-xl gap-1.5 text-xs border-gray-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                  title="Gửi báo cáo 7 ngày"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Báo cáo tuần
                </Button>
              </div>
              {sendReportMsg && <p className="text-xs text-gray-600">{sendReportMsg}</p>}
            </div>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
            <div className="w-8 h-8 rounded-full bg-ncn-purple/10 flex items-center justify-center text-ncn-purple font-bold text-sm">
              A
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Page title + Tabs */}
        <div>
          <h1 className="text-2xl font-black text-gray-900">
            Bảng điều khiển Admin
          </h1>
          <p className="text-gray-500 text-sm">
            Quản lý toàn bộ hệ thống NCN Academy
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
          {(
            [
              { id: "overview", label: "📊 Tổng quan" },
              { id: "affiliate", label: "🤝 Báo cáo Affiliate" },
              { id: "coupons", label: "🎟️ Mã ưu đãi" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-white shadow-sm text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══════════════════════ COUPONS TAB ═══════════════════════════════ */}
        {activeTab === "coupons" && (
          <div className="space-y-5">
            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: "Tổng mã",
                  value: coupons.length,
                  color: "text-gray-900",
                },
                {
                  label: "Đã dùng",
                  value: coupons.filter((c) => c.used && !c.isAdmin).length,
                  color: "text-red-600",
                },
                {
                  label: "Còn lại",
                  value: coupons.filter((c) => !c.used && !c.isAdmin).length,
                  color: "text-emerald-600",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white rounded-2xl border border-gray-100 p-4 text-center"
                >
                  <div className={`text-2xl font-black ${s.color}`}>
                    {s.value}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Thêm mã mới */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-ncn-purple" /> Thêm mã mới
              </h3>
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">
                    Mã coupon *
                  </label>
                  <Input
                    id="new-coupon-code"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="VD: VIP-ABC123"
                    className="w-44 rounded-xl uppercase text-sm"
                    onKeyDown={(e) => e.key === "Enter" && handleAddCoupon()}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">
                    Nhóm
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="h-9 px-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ncn-purple/30"
                  >
                    {["FREE", "VIP", "GIFT", "PRO", "NCN", "CUSTOM"].map(
                      (t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ),
                    )}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">
                    Ghi chú (tùy chọn)
                  </label>
                  <Input
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="VD: Tặng cho khách VIP tháng 7"
                    className="w-52 rounded-xl text-sm"
                  />
                </div>
                <div className="flex items-center gap-2 pb-0.5">
                  <input
                    id="admin-code-toggle"
                    type="checkbox"
                    checked={newAdmin}
                    onChange={(e) => setNewAdmin(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <label
                    htmlFor="admin-code-toggle"
                    className="text-sm text-gray-600 cursor-pointer"
                  >
                    Vô hạn lần
                  </label>
                </div>
                <Button
                  onClick={handleAddCoupon}
                  disabled={addLoading || !newCode.trim()}
                  className="bg-ncn-purple hover:bg-ncn-purple-dark text-white rounded-xl gap-1.5 h-9"
                >
                  {addLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  Tạo mã
                </Button>
              </div>
              {addError && (
                <p className="mt-2 text-xs text-red-500">{addError}</p>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex gap-1.5">
                {(["ALL", "AVAILABLE", "USED"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setCouponFilter(f)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      couponFilter === f
                        ? "bg-ncn-purple text-white"
                        : "bg-gray-100 text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {f === "ALL"
                      ? "Tất cả"
                      : f === "AVAILABLE"
                        ? "✅ Còn dùng"
                        : "❌ Đã dùng"}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {deleteMsg && (
                  <span className="text-xs text-gray-600">{deleteMsg}</span>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setCouponLoaded(false);
                  }}
                  className="rounded-xl gap-1.5 text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Làm mới
                </Button>
              </div>
            </div>

            {/* Table */}
            {couponLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-ncn-purple" />
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                        Mã coupon
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">
                        Nhóm
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">
                        Ghi chú
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">
                        Trạng thái
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">
                        Đơn hàng
                      </th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons
                      .filter((c) =>
                        couponFilter === "ALL"
                          ? true
                          : couponFilter === "USED"
                            ? c.used && !c.isAdmin
                            : !c.used || c.isAdmin,
                      )
                      .map((c) => (
                        <tr
                          key={c.code}
                          className="border-b border-gray-50 hover:bg-gray-50/50"
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <code className="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                                {c.code}
                              </code>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(c.code);
                                }}
                                className="text-gray-400 hover:text-gray-600"
                                title="Copy mã"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
                                c.type === "ADMIN"
                                  ? "bg-red-100 text-red-700"
                                  : c.type === "VIP"
                                    ? "bg-purple-100 text-purple-700"
                                    : c.type === "FREE"
                                      ? "bg-blue-100 text-blue-700"
                                      : c.type === "GIFT"
                                        ? "bg-emerald-100 text-emerald-700"
                                        : c.type === "PRO"
                                          ? "bg-orange-100 text-orange-700"
                                          : c.type === "NCN"
                                            ? "bg-ncn-purple/10 text-ncn-purple"
                                            : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              <Tag className="w-2.5 h-2.5" /> {c.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 max-w-[160px] truncate">
                            {c.note || "—"}
                          </td>
                          <td className="px-4 py-3">
                            {c.isAdmin ? (
                              <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                                ∞ Vô hạn
                              </span>
                            ) : c.used ? (
                              <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                                ❌ Đã dùng
                              </span>
                            ) : (
                              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                                ✅ Còn dùng
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                            {c.orderCode ? `#${c.orderCode}` : "—"}
                          </td>
                          <td className="px-4 py-3">
                            {!c.used && !c.isAdmin && (
                              <button
                                onClick={() => handleDeleteCoupon(c.code)}
                                className="text-red-400 hover:text-red-600 transition-colors p-1 rounded"
                                title="Xóa mã"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    {coupons.filter((c) =>
                      couponFilter === "ALL"
                        ? true
                        : couponFilter === "USED"
                          ? c.used && !c.isAdmin
                          : !c.used || c.isAdmin,
                    ).length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center py-8 text-sm text-gray-400"
                        >
                          Không có mã nào
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════ AFFILIATE REPORT TAB ═══════════════════════ */}
        {activeTab === "affiliate" && (
          <div className="space-y-5">
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <select
                    value={affMonth}
                    onChange={(e) => {
                      setAffMonth(+e.target.value);
                      setAffLoaded(false);
                    }}
                    className="appearance-none pl-4 pr-8 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-ncn-purple/30"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        Tháng {m}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
                <div className="relative">
                  <select
                    value={affYear}
                    onChange={(e) => {
                      setAffYear(+e.target.value);
                      setAffLoaded(false);
                    }}
                    className="appearance-none pl-4 pr-8 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-ncn-purple/30"
                  >
                    {[2025, 2026, 2027].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setAffLoaded(false);
                  }}
                  className="bg-ncn-purple hover:bg-ncn-purple-dark text-white rounded-xl gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Tải lại
                </Button>
              </div>

              {/* Summary badge */}
              {affData.length > 0 && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
                  <HandCoins className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-bold text-amber-800">
                    Tổng hoa hồng cần trả:{" "}
                    {totalCommission.toLocaleString("vi-VN")}đ
                  </span>
                  <span className="text-xs text-amber-600">
                    ({affData.length} affiliate)
                  </span>
                </div>
              )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {affLoading ? (
                <div className="flex items-center justify-center gap-3 py-16 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Đang tải dữ liệu...</span>
                </div>
              ) : affLoaded && affData.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="text-sm font-medium">
                    Không có affiliate nào có đơn hàng trong tháng {affMonth}/
                    {affYear}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/60">
                        {[
                          "Affiliate",
                          "Mã giới thiệu",
                          "Tier",
                          "Đơn tháng",
                          "Doanh thu tháng",
                          "Hoa hồng",
                          "Nội dung CK",
                          "",
                        ].map((h) => (
                          <th
                            key={h}
                            className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {affData.map((row) => (
                        <tr
                          key={row.referralCode}
                          className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                        >
                          {/* Name + contact */}
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-900">
                              {row.name}
                            </p>
                            <p className="text-xs text-gray-400">{row.phone}</p>
                          </td>

                          {/* Code */}
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs bg-gray-100 px-2.5 py-1 rounded-lg text-gray-700 font-bold">
                              {row.referralCode}
                            </span>
                          </td>

                          {/* Tier badge */}
                          <td className="px-4 py-3">
                            <TierBadge
                              tierName={row.tierName}
                              rate={row.commissionRate}
                            />
                          </td>

                          {/* Monthly orders */}
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`font-bold text-sm ${row.monthOrderCount > 0 ? "text-ncn-purple" : "text-gray-300"}`}
                            >
                              {row.monthOrderCount}
                            </span>
                            <p className="text-xs text-gray-400">
                              / {row.lifetimeOrders} TT
                            </p>
                          </td>

                          {/* Revenue */}
                          <td className="px-4 py-3 text-right font-semibold text-gray-700 whitespace-nowrap">
                            {row.monthRevenue > 0
                              ? row.monthRevenue.toLocaleString("vi-VN") + "đ"
                              : "—"}
                          </td>

                          {/* Commission */}
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <span
                              className={`font-black text-base ${row.commissionOwed > 0 ? "text-green-600" : "text-gray-300"}`}
                            >
                              {row.commissionOwed > 0
                                ? row.commissionOwed.toLocaleString("vi-VN") +
                                  "đ"
                                : "—"}
                            </span>
                          </td>

                          {/* Payout content */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <code className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-mono whitespace-nowrap border border-blue-100">
                                {row.payoutContent}
                              </code>
                            </div>
                            {row.bankName && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                {row.bankName} · {row.bankAccount}
                              </p>
                            )}
                          </td>

                          {/* Copy button */}
                          <td className="px-4 py-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-lg hover:bg-green-50"
                              onClick={() =>
                                handleCopy(row.payoutContent, row.referralCode)
                              }
                              title="Copy nội dung chuyển khoản"
                            >
                              {copiedCode === row.referralCode ? (
                                <Check className="w-3.5 h-3.5 text-green-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-gray-400" />
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════ OVERVIEW TAB ═══════════════════════ */}
        {activeTab === "overview" && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: "Tổng người dùng",
                  value: "5.284",
                  change: "+127 tháng này",
                  icon: Users,
                  color: "text-blue-600",
                  bg: "bg-blue-50",
                },
                {
                  label: "Doanh thu tháng",
                  value: "8.9M đ",
                  change: "+62% vs tháng trước",
                  icon: DollarSign,
                  color: "text-green-600",
                  bg: "bg-green-50",
                },
                {
                  label: "Tỷ lệ chuyển đổi",
                  value: "12.4%",
                  change: "+2.1% vs tháng trước",
                  icon: TrendingUp,
                  color: "text-ncn-purple",
                  bg: "bg-ncn-purple/10",
                },
                {
                  label: "Báo cáo đã xuất",
                  value: "648",
                  change: "Tổng cộng",
                  icon: FileText,
                  color: "text-amber-600",
                  bg: "bg-amber-50",
                },
              ].map((s, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
                >
                  <div
                    className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-3`}
                  >
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-xs font-medium text-gray-500 mt-0.5">
                    {s.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{s.change}</p>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Revenue chart */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold text-gray-900">
                    Doanh thu & Người dùng
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-gray-400"
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Xuất báo cáo
                  </Button>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient
                        id="colorRevenue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#635bff"
                          stopOpacity={0.15}
                        />
                        <stop
                          offset="95%"
                          stopColor="#635bff"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f1f5f9"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip
                      formatter={(v: number) => [
                        `${v.toLocaleString("vi-VN")}đ`,
                        "Doanh thu",
                      ]}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#635bff"
                      strokeWidth={2}
                      fill="url(#colorRevenue)"
                      dot={{ fill: "#635bff", r: 3 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Plan distribution */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-bold text-gray-900 mb-5">Phân phối gói</h2>
                <div className="flex justify-center">
                  <PieChart width={160} height={160}>
                    <Pie
                      data={planDist}
                      cx={80}
                      cy={80}
                      innerRadius={45}
                      outerRadius={70}
                      dataKey="value"
                    >
                      {planDist.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </div>
                <div className="space-y-2 mt-4">
                  {planDist.map((p) => (
                    <div
                      key={p.name}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ background: p.color }}
                        />
                        <span className="text-sm text-gray-600">{p.name}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        {p.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Users table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h2 className="font-bold text-gray-900">Quản lý người dùng</h2>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Tìm kiếm..."
                      className="pl-9 text-sm rounded-lg w-56 border-gray-200"
                    />
                  </div>
                  <Button
                    size="sm"
                    className="bg-ncn-purple hover:bg-ncn-purple-dark rounded-lg text-xs"
                  >
                    + Thêm người dùng
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {[
                        "Người dùng",
                        "Email",
                        "Gói",
                        "Ngày tham gia",
                        "Doanh thu",
                        "Trạng thái",
                        "",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-ncn-purple/10 text-ncn-purple font-bold text-xs flex items-center justify-center">
                              {u.name.charAt(0)}
                            </div>
                            <span className="font-medium text-gray-900">
                              {u.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-gray-500">{u.email}</td>
                        <td className="px-5 py-4">
                          <Badge
                            className={
                              u.plan === "Pro"
                                ? "bg-ncn-purple/10 text-ncn-purple border-0"
                                : "bg-gray-100 text-gray-500 border-0"
                            }
                          >
                            {u.plan}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-gray-400 text-xs">
                          {u.joined}
                        </td>
                        <td className="px-5 py-4 font-semibold text-gray-900">
                          {u.revenue}
                        </td>
                        <td className="px-5 py-4">
                          <div
                            className={`flex items-center gap-1.5 text-xs font-medium ${u.status === "active" ? "text-green-600" : "text-gray-400"}`}
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${u.status === "active" ? "bg-green-500" : "bg-gray-300"}`}
                            />
                            {u.status === "active"
                              ? "Hoạt động"
                              : "Không hoạt động"}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                          >
                            <MoreHorizontal className="w-4 h-4 text-gray-400" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── TierBadge ──────────────────────────────────────────────────────────────
function TierBadge({ tierName, rate }: { tierName: string; rate: number }) {
  const styles: Record<string, string> = {
    "Kim Cương": "bg-cyan-50 text-cyan-700 border-cyan-200",
    Vàng: "bg-amber-50 text-amber-700 border-amber-200",
    Bạc: "bg-gray-100 text-gray-600 border-gray-200",
    "Thành viên": "bg-purple-50 text-purple-700 border-purple-200",
  };
  const icons: Record<string, string> = {
    "Kim Cương": "💎",
    Vàng: "🥇",
    Bạc: "🥈",
    "Thành viên": "🎖️",
  };
  const cls = styles[tierName] ?? "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${cls} whitespace-nowrap`}
    >
      {icons[tierName] ?? "🎖️"} {tierName}
      <span className="opacity-70">· {Math.round(rate * 100)}%</span>
    </span>
  );
}
