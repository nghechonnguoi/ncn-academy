"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Brain, Bot, Settings,
  Users, LogOut, CreditCard, TrendingUp, ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { label: "Tổng quan", href: "/dashboard", icon: LayoutDashboard },
  { label: "Làm bài test", href: "/assessment", icon: ClipboardList },
  { label: "AI Advisor", href: "/ai-tools", icon: Bot },
  { label: "Affiliate", href: "/affiliate", icon: Users },
  { label: "Thanh toán", href: "/checkout?plan=pro", icon: CreditCard },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).slice(-2).join("").toUpperCase()
    : "U";

  const handleLogout = async () => {
    await logout();
    document.cookie = "ncn_auth=; path=/; max-age=0";
    router.push("/");
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="w-8 h-8 rounded-lg bg-[#635bff] flex items-center justify-center text-white text-sm">
            🧭
          </span>
          <span className="text-gray-900">NCN<span className="text-[#635bff]">Academy</span></span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-[#635bff]/10 text-[#635bff]"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className={cn("w-4 h-4", isActive ? "text-[#635bff]" : "text-gray-400")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-9 h-9">
            <AvatarImage src={user?.avatar ?? ""} />
            <AvatarFallback className="bg-[#635bff]/10 text-[#635bff] font-bold text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name ?? "Người dùng"}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email ?? ""}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-gray-500 hover:text-red-600 text-xs"
          onClick={handleLogout}
        >
          <LogOut className="w-3.5 h-3.5 mr-2" />
          Đăng xuất
        </Button>
      </div>
    </aside>
  );
}
