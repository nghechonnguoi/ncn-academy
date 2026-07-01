"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { FormEvent, useState } from "react";

export function CtaSection() {
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [error, setError] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("fullName") as string;
    const email = formData.get("email") as string;
    
    if (!name || !email) {
      setError(true);
      setTimeout(() => setError(false), 400);
      return;
    }

    setStatus("loading");
    
    // Simulate API call
    setTimeout(() => {
      setStatus("success");
      (e.target as HTMLFormElement).reset();
      
      // Reset success status after a few seconds
      setTimeout(() => setStatus("idle"), 4000);
    }, 900);
  };

  return (
    <section id="contact" className="bg-ncn-black-2 py-[100px] px-6 relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-[80px] items-center relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-extrabold tracking-[3px] text-ncn-orange uppercase mb-4">
            <span className="w-6 h-[2px] bg-ncn-orange" />
            Bắt đầu ngay hôm nay
          </div>
          <h2 className="text-[clamp(36px,4vw,56px)] font-black leading-[1.05] tracking-[-1.5px] mb-4">
            SẴN SÀNG ĐỊNH VỊ<br />
            <span className="text-ncn-orange">TƯƠNG LAI CỦA BẠN?</span>
          </h2>
          <p className="text-[16px] text-ncn-gray leading-[1.6]">
            Hãy để lại thông tin — đội ngũ chuyên gia sẽ liên hệ trong vòng 24 giờ để tư vấn và hỗ trợ bạn chọn đúng hướng đi.
          </p>
          
          <div className="mt-[32px] flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-[13.5px] text-ncn-gray">
              <span className="text-ncn-orange">📍</span> Việt Nam — Hoạt động toàn quốc
            </div>
            <div className="flex items-center gap-2 text-[13.5px] text-ncn-gray">
              <span className="text-ncn-orange">📧</span> info@nghechonnguoi.com
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input 
                type="text" 
                name="fullName" 
                placeholder="Họ và tên *" 
                required 
                className="bg-ncn-black-3 border border-white/10 text-white p-[14px_18px] rounded-[4px] text-[14px] outline-none focus:border-ncn-orange transition-colors placeholder:text-ncn-gray"
              />
              <input 
                type="text" 
                name="school" 
                placeholder="Trường / Đơn vị" 
                className="bg-ncn-black-3 border border-white/10 text-white p-[14px_18px] rounded-[4px] text-[14px] outline-none focus:border-ncn-orange transition-colors placeholder:text-ncn-gray"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input 
                type="email" 
                name="email" 
                placeholder="Email *" 
                required 
                className="bg-ncn-black-3 border border-white/10 text-white p-[14px_18px] rounded-[4px] text-[14px] outline-none focus:border-ncn-orange transition-colors placeholder:text-ncn-gray"
              />
              <input 
                type="tel" 
                name="phone" 
                placeholder="Số điện thoại" 
                className="bg-ncn-black-3 border border-white/10 text-white p-[14px_18px] rounded-[4px] text-[14px] outline-none focus:border-ncn-orange transition-colors placeholder:text-ncn-gray"
              />
            </div>
            <textarea 
              name="message" 
              placeholder="Bạn muốn hỏi về điều gì?"
              className="bg-ncn-black-3 border border-white/10 text-white p-[14px_18px] rounded-[4px] text-[14px] outline-none focus:border-ncn-orange transition-colors placeholder:text-ncn-gray min-h-[100px] resize-y"
            ></textarea>
            
            <motion.button 
              type="submit" 
              disabled={status === "loading"}
              className={`mt-2 bg-ncn-orange text-white py-[16px] px-[32px] rounded-[4px] font-bold text-[14px] flex items-center justify-center gap-2 transition-all duration-250 hover:bg-ncn-orange-dark hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(249,115,22,0.35)] disabled:opacity-70 disabled:cursor-not-allowed`}
              animate={error ? { x: [-6, 6, -6, 6, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              {status === "loading" ? "Đang gửi..." : (
                <>Gửi thông tin <ArrowRight className="w-4 h-4" /></>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>

      {/* Toast Notification */}
      <div 
        className={`fixed bottom-[30px] right-[30px] z-[9999] bg-ncn-orange text-white p-[14px_22px] rounded-[6px] font-bold text-[14px] flex items-center gap-[10px] transition-all duration-[350ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none ${
          status === "success" ? "translate-y-0 opacity-100" : "translate-y-[80px] opacity-0"
        }`}
      >
        ✅ Gửi thành công! Chúng tôi sẽ liên hệ trong 24h.
      </div>
    </section>
  );
}
