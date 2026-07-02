"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { LiveTrafficCounter } from "./live-traffic-counter";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-[#0a0a0a] via-[#1a0a00] to-[#111111]">
      {/* Background SVG Grid */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><rect width="60" height="60" fill="none"/><line x1="0" y1="60" x2="60" y2="0" stroke="rgba(249,115,22,0.04)" stroke-width="1"/></svg>')`
          }}
        />
      </div>
      
      {/* Radial overlay */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          background: 'radial-gradient(ellipse at 70% 50%, rgba(249,115,22,0.12) 0%, transparent 60%)'
        }}
      />

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 pt-[120px] pb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 text-[12px] font-extrabold tracking-[3px] text-ncn-orange uppercase mb-6">
            <span className="w-[30px] h-[2px] bg-ncn-orange" />
            Định vị nghề nghiệp · Khoa học · Chính xác
          </div>
          
          <h1 className="text-[clamp(52px,7vw,96px)] font-black leading-[1] tracking-[-2px] mb-6 max-w-[750px] text-white">
            HIỂU ĐÚNG NĂNG LỰC.
            <span className="text-ncn-orange block mt-2">ĐI ĐÚNG CON ĐƯỜNG.</span>
          </h1>

          <p className="text-[17px] text-ncn-gray-light leading-[1.7] max-w-[520px] mb-11">
            Nghề Chọn Người cung cấp hệ thống phân tích nghề nghiệp đa biến hàng đầu Việt Nam — kết hợp Holland RIASEC, MBTI và Ikigai để định vị chính xác con đường sự nghiệp phù hợp nhất với bạn.
          </p>

          <div className="flex flex-wrap gap-4 mb-[70px]">
            <Link 
              href="https://quiz.nghechonnguoi.com" 
              className="bg-ncn-orange text-white px-8 py-4 rounded font-bold text-[15px] flex items-center gap-2 border-2 border-ncn-orange hover:bg-ncn-orange-dark hover:border-ncn-orange-dark hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(249,115,22,0.35)] transition-all duration-250"
            >
              <Sparkles className="w-5 h-5" />
              Làm bài khảo sát <ArrowRight className="w-4 h-4" />
            </Link>
            
            <a 
              href="#products" 
              className="bg-transparent text-white px-8 py-4 rounded font-bold text-[15px] flex items-center gap-2 border-2 border-white/30 hover:border-white hover:bg-white/5 transition-all duration-250"
            >
              Xem sản phẩm ↓
            </a>
          </div>

          <div className="flex flex-wrap gap-[50px]">
            <div>
              <div className="text-[36px] font-black text-ncn-orange leading-none">1000+</div>
              <div className="text-[12px] text-ncn-gray mt-1 uppercase tracking-[1px] font-semibold">Ngành nghề</div>
            </div>
            <div>
              <div className="text-[36px] font-black text-ncn-orange leading-none">5</div>
              <div className="text-[12px] text-ncn-gray mt-1 uppercase tracking-[1px] font-semibold">Bộ công cụ</div>
            </div>
            <div>
              <LiveTrafficCounter className="text-[36px] font-black text-ncn-orange leading-none" />
              <div className="text-[12px] text-ncn-gray mt-1 uppercase tracking-[1px] font-semibold">Lưu lượng truy cập</div>
            </div>
            <div>
              <div className="text-[36px] font-black text-ncn-orange leading-none">30s</div>
              <div className="text-[12px] text-ncn-gray mt-1 uppercase tracking-[1px] font-semibold">Biết ngay kết quả</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
