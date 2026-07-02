"use client";

import { motion } from "framer-motion";

const PROCESS_STEPS = [
  {
    step: "Bước 01",
    icon: "📝",
    title: "Điền Thông Tin Cá Nhân",
    desc: "Cung cấp thông tin cơ bản: tên, ngày sinh, email và định hướng ban đầu của bạn.",
  },
  {
    step: "Bước 02",
    icon: "🎯",
    title: "Làm Bài Khảo Sát",
    desc: "Hoàn thành 40+ câu hỏi được thiết kế bởi chuyên gia nhân sự và tâm lý học nghề nghiệp.",
  },
  {
    step: "Bước 03",
    icon: "⚙️",
    title: "Thuật Toán Phân Tích",
    desc: "Hệ thống đối chiếu dữ liệu đa biến: Holland × MBTI × Nhân số học × Xu hướng thị trường.",
  },
  {
    step: "Bước 04",
    icon: "📊",
    title: "Nhận Báo Cáo Cá Nhân",
    desc: "Nhận kết quả chi tiết với TOP 5 nghề nghiệp phù hợp và lộ trình hành động cụ thể.",
  },
];

export function ProcessSection() {
  return (
    <section id="process" className="bg-ncn-black-2 py-[100px] px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="inline-flex items-center gap-2 text-[11px] font-extrabold tracking-[3px] text-ncn-orange uppercase mb-4">
          <span className="w-6 h-[2px] bg-ncn-orange" />
          Quy trình
        </div>
        <h2 className="text-[clamp(32px,4vw,52px)] font-black leading-[1.1] tracking-[-1px]">
          4 BƯỚC ĐẾN <span className="text-ncn-orange">KẾT QUẢ</span>
        </h2>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[2px] bg-white/5 mt-[60px]"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          {PROCESS_STEPS.map((s, idx) => (
            <div 
              key={idx}
              className="bg-ncn-black-2 p-[40px_28px] relative group"
            >
              <div className="text-[11px] font-extrabold tracking-[2px] text-ncn-orange uppercase mb-[16px]">{s.step}</div>
              <span className="text-[28px] mb-[16px] block">{s.icon}</span>
              <div className="text-[16px] font-extrabold mb-[10px]">{s.title}</div>
              <div className="text-[13px] text-ncn-gray leading-[1.6]">{s.desc}</div>
              
              {idx < PROCESS_STEPS.length - 1 && (
                <div className="hidden lg:block absolute right-[-12px] top-1/2 -translate-y-1/2 text-ncn-orange text-[20px] z-10 font-bold">
                  ›
                </div>
              )}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
