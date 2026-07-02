"use client";

import { motion } from "framer-motion";
import { LiveTrafficCounter } from "./live-traffic-counter";

export function StatsSection() {
  return (
    <section className="bg-ncn-orange py-[60px]">
      <div className="max-w-[1200px] mx-auto px-6">
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-0"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="p-[20px_10px] md:p-[20px_40px] text-center md:border-r border-black/15 last:border-none">
            <LiveTrafficCounter className="text-[36px] md:text-[48px] font-black text-white leading-none tracking-[-2px]" />
            <div className="text-[10px] md:text-[12px] font-bold text-black/60 uppercase tracking-[1.5px] mt-[6px]">Lưu lượng truy cập</div>
          </div>
          <div className="p-[20px_10px] md:p-[20px_40px] text-center md:border-r border-black/15 last:border-none">
            <div className="text-[36px] md:text-[48px] font-black text-white leading-none tracking-[-2px]">1000+</div>
            <div className="text-[10px] md:text-[12px] font-bold text-black/60 uppercase tracking-[1.5px] mt-[6px]">Ngành nghề phân tích</div>
          </div>
          <div className="p-[20px_10px] md:p-[20px_40px] text-center md:border-r border-black/15 last:border-none">
            <div className="text-[36px] md:text-[48px] font-black text-white leading-none tracking-[-2px]">5</div>
            <div className="text-[10px] md:text-[12px] font-bold text-black/60 uppercase tracking-[1.5px] mt-[6px]">Bộ công cụ tâm lý học</div>
          </div>
          <div className="p-[20px_10px] md:p-[20px_40px] text-center md:border-r border-black/15 last:border-none">
            <div className="text-[36px] md:text-[48px] font-black text-white leading-none tracking-[-2px]">5 giây</div>
            <div className="text-[10px] md:text-[12px] font-bold text-black/60 uppercase tracking-[1.5px] mt-[6px]">Thời gian xuất báo cáo</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
