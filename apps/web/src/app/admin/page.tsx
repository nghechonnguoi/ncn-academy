"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users, DollarSign, TrendingUp, FileText,
  Search, MoreHorizontal, Check, X, Download, Settings
} from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import Link from "next/link";

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
  { id: "1", name: "Nguyễn Văn An", email: "an@gmail.com", plan: "Pro", status: "active", joined: "01/06/2026", revenue: "299.000đ" },
  { id: "2", name: "Trần Thị Bình", email: "binh@gmail.com", plan: "Free", status: "active", joined: "05/06/2026", revenue: "0đ" },
  { id: "3", name: "Lê Minh Châu", email: "chau@gmail.com", plan: "Pro", status: "active", joined: "10/06/2026", revenue: "299.000đ" },
  { id: "4", name: "Phạm Đức Dũng", email: "dung@gmail.com", plan: "Free", status: "inactive", joined: "15/06/2026", revenue: "0đ" },
];

export default function AdminPage() {
  const [search, setSearch] = useState("");
  const filtered = users.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.includes(search)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 font-bold">
              <span className="w-8 h-8 rounded-lg bg-ncn-purple flex items-center justify-center text-white">🧭</span>
              <span>NCN<span className="text-ncn-purple">Admin</span></span>
            </Link>
            <Badge className="bg-red-100 text-red-700 border-0 text-xs">ADMIN PANEL</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm"><Settings className="w-4 h-4" /></Button>
            <div className="w-8 h-8 rounded-full bg-ncn-purple/10 flex items-center justify-center text-ncn-purple font-bold text-sm">A</div>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Page title */}
        <div>
          <h1 className="text-2xl font-black text-gray-900">Bảng điều khiển Admin</h1>
          <p className="text-gray-500 text-sm">Quản lý toàn bộ hệ thống NCN Academy</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Tổng người dùng", value: "5.284", change: "+127 tháng này", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Doanh thu tháng", value: "8.9M đ", change: "+62% vs tháng trước", icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
            { label: "Tỷ lệ chuyển đổi", value: "12.4%", change: "+2.1% vs tháng trước", icon: TrendingUp, color: "text-ncn-purple", bg: "bg-ncn-purple/10" },
            { label: "Báo cáo đã xuất", value: "648", change: "Tổng cộng", icon: FileText, color: "text-amber-600", bg: "bg-amber-50" },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs font-medium text-gray-500 mt-0.5">{s.label}</p>
              <p className="text-xs text-gray-400 mt-1">{s.change}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Revenue chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900">Doanh thu & Người dùng</h2>
              <Button variant="ghost" size="sm" className="text-xs text-gray-400">
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Xuất báo cáo
              </Button>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#635bff" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#635bff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                <Tooltip
                  formatter={(v: number) => [`${v.toLocaleString("vi-VN")}đ`, "Doanh thu"]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#635bff" strokeWidth={2}
                  fill="url(#colorRevenue)" dot={{ fill: "#635bff", r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Plan distribution */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-5">Phân phối gói</h2>
            <div className="flex justify-center">
              <PieChart width={160} height={160}>
                <Pie data={planDist} cx={80} cy={80} innerRadius={45} outerRadius={70} dataKey="value">
                  {planDist.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </div>
            <div className="space-y-2 mt-4">
              {planDist.map((p) => (
                <div key={p.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: p.color }} />
                    <span className="text-sm text-gray-600">{p.name}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{p.value}%</span>
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
              <Button size="sm" className="bg-ncn-purple hover:bg-ncn-purple-dark rounded-lg text-xs">
                + Thêm người dùng
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Người dùng", "Email", "Gói", "Ngày tham gia", "Doanh thu", "Trạng thái", ""].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-ncn-purple/10 text-ncn-purple font-bold text-xs flex items-center justify-center">
                          {u.name.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-500">{u.email}</td>
                    <td className="px-5 py-4">
                      <Badge className={u.plan === "Pro" ? "bg-ncn-purple/10 text-ncn-purple border-0" : "bg-gray-100 text-gray-500 border-0"}>
                        {u.plan}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs">{u.joined}</td>
                    <td className="px-5 py-4 font-semibold text-gray-900">{u.revenue}</td>
                    <td className="px-5 py-4">
                      <div className={`flex items-center gap-1.5 text-xs font-medium ${u.status === "active" ? "text-green-600" : "text-gray-400"}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${u.status === "active" ? "bg-green-500" : "bg-gray-300"}`} />
                        {u.status === "active" ? "Hoạt động" : "Không hoạt động"}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
