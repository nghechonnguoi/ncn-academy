"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const NAV_LINKS = [
  { href: "/#services", label: "Dịch vụ" },
  { href: "/#products", label: "Sản phẩm" },
  { href: "https://nghechonnguoi.com/dang-ky-affiliate.html", label: "Affiliate" },
  { href: "/#process", label: "Quy trình" },
  { href: "/#contact", label: "Liên hệ" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[1000] bg-[#111]/95 backdrop-blur-[10px] border-b border-ncn-orange/15 px-6 md:px-[60px] h-[70px] flex items-center justify-between transition-all duration-300">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-[10px]">
          <div className="w-[36px] h-[36px] bg-ncn-orange rounded-[6px] flex items-center justify-center text-[18px]">🧭</div>
          <div className="text-[17px] font-extrabold tracking-[-0.3px] text-white">Nghề<span className="text-ncn-orange">Chọn</span>Người</div>
        </Link>

        {/* Desktop Nav */}
        <ul className="hidden md:flex items-center gap-[36px] list-none">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-[13px] font-bold text-ncn-gray-light tracking-[0.5px] uppercase transition-colors duration-200 hover:text-ncn-orange"
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <Link 
              href="https://quiz.nghechonnguoi.com" 
              className="bg-ncn-orange text-white px-[22px] py-[10px] rounded-[4px] font-bold text-[13px] flex items-center gap-[6px] transition-all duration-200 hover:bg-ncn-orange-dark hover:-translate-y-[1px]"
            >
              Bắt đầu ngay →
            </Link>
          </li>
        </ul>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-1 flex flex-col gap-[5px] cursor-pointer bg-transparent border-none"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          <span className={`w-[22px] h-[2px] bg-white rounded-[2px] transition-all duration-300 ${mobileOpen ? 'translate-y-[7px] rotate-45' : ''}`}></span>
          <span className={`w-[22px] h-[2px] bg-white rounded-[2px] transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`}></span>
          <span className={`w-[22px] h-[2px] bg-white rounded-[2px] transition-all duration-300 ${mobileOpen ? '-translate-y-[7px] -rotate-45' : ''}`}></span>
        </button>
      </nav>

      {/* Mobile menu */}
      <div 
        className={`fixed top-[70px] left-0 right-0 bg-[#111]/98 backdrop-blur-[12px] border-b border-ncn-orange/20 flex-col p-[20px_24px_28px] gap-1 z-[999] transition-all duration-300 md:hidden ${mobileOpen ? 'flex' : 'hidden'}`}
      >
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-[15px] font-bold text-ncn-gray-light py-[12px] border-b border-white/5 uppercase tracking-[0.5px] transition-colors hover:text-ncn-orange"
            onClick={() => setMobileOpen(false)}
          >
            {link.label}
          </Link>
        ))}
        <Link 
          href="https://quiz.nghechonnguoi.com" 
          className="bg-ncn-orange text-white px-[22px] py-[12px] mt-[10px] rounded-[4px] font-bold text-[13px] flex items-center justify-center gap-[6px]"
          onClick={() => setMobileOpen(false)}
        >
          Bắt đầu ngay →
        </Link>
      </div>
    </>
  );
}
