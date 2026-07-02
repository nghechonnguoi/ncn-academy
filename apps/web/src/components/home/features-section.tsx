"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const SERVICES = [
  {
    icon: "🧭",
    title: "Định Vị Nghề Nghiệp",
    desc: "Phân tích các nhóm ngành nghề chuyên sâu, xác định nhóm nghề nghiệp phù hợp nhất với cấu trúc năng lực hành vi.",
  },
  {
    icon: "🧠",
    title: "Phân Tích Tính Cách",
    desc: "Kết hợp các nền tảng khoa học tâm lý học, giải mã phong cách tư duy và phương thức vận hành độc đáo của cá nhân.",
  },
  {
    icon: "📊",
    title: "Báo Cáo Khoa Học",
    desc: "Báo cáo PDF Premium 15 trang cá nhân hóa 100% — lộ trình thăng tiến, ma trận thu nhập và kế hoạch 4 năm.",
  },
  {
    icon: "🚀",
    title: "Lộ Trình Thăng Tiến",
    desc: "Sơ đồ lộ trình từ Junior đến C-Suite cho từng nghề nghiệp kèm dữ liệu thu nhập thực tế từ thị trường Việt Nam.",
  },
  {
    icon: "🏆",
    title: "Xây Dựng Thương Hiệu",
    desc: "Chiến lược personal branding trên LinkedIn, định vị chuyên gia dựa trên giá trị khoa học đo lường được.",
  },
  {
    icon: "🎓",
    title: "Tư Vấn Chọn Ngành",
    desc: "Dựa trên mô hình môi trường làm việc chuẩn quốc tế, giúp ứng viên tìm thấy nơi thuộc về mình.",
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
