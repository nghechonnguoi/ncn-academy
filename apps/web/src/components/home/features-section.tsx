"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const SERVICES = [
  {
    icon: "🧭",
    title: "Định Vị Nghề Nghiệp",
    desc: "Xác định chính xác TOP 5 nhóm nghề nghiệp sinh ra dành cho bạn dựa trên cấu trúc năng lực và tính cách.",
  },
  {
    icon: "🧠",
    title: "Phân Tích Đa Chiều",
    desc: "Kết hợp các nền tảng khoa học tâm lý, giải mã phong cách tư duy, năng lực bẩm sinh và khao khát nội tại.",
  },
  {
    icon: "📊",
    title: "Báo Cáo Cá Nhân Hóa",
    desc: "Báo cáo PDF Premium độc bản 100% — định hướng lộ trình sự nghiệp rõ ràng và chi tiết nhất.",
  },
  {
    icon: "🚀",
    title: "Phân Tích Chi Tiết Nghề",
    desc: "Cung cấp góc nhìn sâu sắc về ưu điểm, thách thức và lộ trình phát triển cho từng nghề nghiệp được đề xuất.",
  },
  {
    icon: "🏆",
    title: "Dự Báo & Vượt Rào Cản",
    desc: "Nhận diện những rào cản tiềm ẩn trong tính cách và cung cấp chiến lược phát triển cá nhân để vượt qua.",
  },
  {
    icon: "🎓",
    title: "Môi Trường Lý Tưởng",
    desc: "Dựa trên mô hình môi trường làm việc chuẩn quốc tế, giúp ứng viên tìm thấy văn hóa doanh nghiệp nơi mình thuộc về.",
  },
];

export function FeaturesSection() {
  return (
    <section id="services" className="bg-ncn-black-2 py-[100px] px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-[60px] gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-extrabold tracking-[3px] text-ncn-orange uppercase mb-4">
              <span className="w-6 h-[2px] bg-ncn-orange" />
              Chúng tôi cung cấp
            </div>
            <h2 className="text-[clamp(32px,4vw,52px)] font-black leading-[1.1] tracking-[-1px]">
              DỊCH VỤ<br />CỦA CHÚNG TÔI
            </h2>
          </div>
          <div className="md:max-w-[400px]">
            <p className="text-[16px] text-ncn-gray leading-[1.7]">
              Từ phân tích cá nhân đến chiến lược sự nghiệp dài hạn, chúng tôi cung cấp đầy đủ công cụ để bạn định hướng tương lai.
            </p>
            <div className="mt-4">
              <Link 
                href="#products" 
                className="text-ncn-orange font-bold text-[14px] flex items-center gap-2 hover:text-ncn-orange-light transition-colors"
              >
                Xem tất cả dịch vụ <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-white/10 border border-white/10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          {SERVICES.map((s, idx) => (
            <div 
              key={idx}
              className="bg-ncn-black-2 p-[36px_32px] transition-colors duration-300 relative overflow-hidden group hover:bg-ncn-black-3"
            >
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-ncn-orange scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              <span className="text-[32px] mb-[20px] block">{s.icon}</span>
              <div className="text-[15px] font-extrabold mb-[10px] uppercase tracking-[0.5px]">{s.title}</div>
              <div className="text-[13px] text-ncn-gray leading-[1.6]">{s.desc}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
