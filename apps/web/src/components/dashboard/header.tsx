"use client";

import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

export function DashboardHeader() {
  const { user } = useAuth();

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).slice(-2).join("").toUpperCase()
    : "U";

  return (
    <header className="bg-white border-b border-gray-100 px-6 h-16 flex items-center justify-between">
      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="Tìm kiếm..." className="pl-10 rounded-xl border-gray-200 text-sm" />
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-4 h-4 text-gray-500" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-ncn-purple" />
        </Button>
        <Link href="/dashboard">
          <Avatar className="w-8 h-8 cursor-pointer">
            <AvatarImage src={user?.avatar ?? ""} />
            <AvatarFallback className="bg-ncn-purple/10 text-ncn-purple text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
}
