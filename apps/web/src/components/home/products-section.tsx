"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const PRODUCTS = [
  {
    num: "01",
    tag: "✅ Đang hoạt động",
    tagClass: "bg-ncn-orange/15 text-ncn-orange border border-ncn-orange/40",
    name: "ĐỊNH VỊ NGHỀ NGHIỆP DÀNH CHO HỌC SINH, SINH VIÊN 14 - 25 TUỔI",
    desc: "Hệ thống phân tích đa chiều kết hợp các công cụ khoa học chuyên sâu — gợi ý TOP 5 nghề nghiệp phù hợp nhất với con người thật của bạn.",
    features: [
      "Hệ thống 40+ câu hỏi đo lường chuẩn xác",
      "Tích hợp các nền tảng phân tích tâm lý học",
      "Gợi ý 5 nghề, ngách nghề, tổ hợp môn học phù hợp",
      "Báo cáo cá nhân hóa chi tiết",
    ],
    btnText: "Làm bài khảo sát →",
    btnLink: "https://quiz.nghechonnguoi.com",
    btnClass: "bg-ncn-orange text-white hover:bg-ncn-orange-dark",
    featured: true,
  },
  {
    num: "02",
    tag: "🔜 Sắp ra mắt",
    tagClass: "bg-white/10 text-ncn-gray border border-white/15",
    name: "KHÁM PHÁ TIỀM NĂNG PHÁT TRIỂN (DÀNH CHO HỌC SINH 7-13 TUỔI)",
    desc: "Công cụ đánh giá đa trí tuệ kết hợp tâm lý học hành vi, giúp cha mẹ thấu hiểu năng khiếu bẩm sinh và xây dựng lộ trình bồi dưỡng sớm cho con.",
    features: [
      "Phân tích tính cách, tiềm năng, đam mê",
      "Khám phá năng khiếu & điểm mạnh cốt lõi",
      "Tư vấn phương pháp học tập cá nhân hóa",
      "Gợi ý môi trường rèn luyện tối ưu",
    ],
    btnText: "Thông báo khi ra mắt",
    btnLink: "#",
    btnClass: "bg-white/5 text-ncn-gray border border-white/10 cursor-not-allowed",
    featured: false,
  },
  {
    num: "03",
    tag: "🔜 Sắp ra mắt",
    tagClass: "bg-white/10 text-ncn-gray border border-white/15",
    name: "ĐỊNH HƯỚNG PHÁT TRIỂN SỰ NGHIỆP (DÀNH CHO NGƯỜI TRƯỞNG THÀNH)",
    desc: "Hệ thống phân tích năng lực lõi, giúp người đi làm hoạch định lộ trình thăng tiến, chuyển đổi nghề nghiệp an toàn và bứt phá thu nhập.",
    features: [
      "Bản đồ lộ trình thăng tiến (Career Growth)",
      "Chiến lược chuyển đổi ngành nghề an toàn",
      "Khám phá lợi thế cạnh tranh cá nhân",
      "Định vị thương hiệu cá nhân",
    ],
    btnText: "Thông báo khi ra mắt",
    btnLink: "#",
    btnClass: "bg-white/5 text-ncn-gray border border-white/10 cursor-not-allowed",
    featured: false,
  },
];

export function ProductsSection() {
  return (
    <section id="products" className="bg-ncn-black py-[100px] px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-[56px] gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-extrabold tracking-[3px] text-ncn-orange uppercase mb-4">
              <span className="w-6 h-[2px] bg-ncn-orange" />
              Sản phẩm số
            </div>
            <h2 className="text-[clamp(32px,4vw,52px)] font-black leading-[1.1] tracking-[-1px]">
              SẢN PHẨM<br />
              <span className="text-ncn-orange">CỦA CHÚNG TÔI</span>
            </h2>
          </div>
          <p className="text-[16px] text-ncn-gray leading-[1.7] max-w-[520px]">
            Mỗi sản phẩm giải quyết một thách thức cụ thể trên hành trình phát triển bản thân và sự nghiệp.
          </p>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[2px] bg-white/5"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          {PRODUCTS.map((p, idx) => (
            <div 
              key={idx}
              className={`bg-ncn-black p-[40px_32px] transition-colors duration-300 relative overflow-hidden hover:bg-[#1a1a1a] border-b-[3px] ${p.featured ? 'border-ncn-orange' : 'border-transparent'}`}
            >
              <span className={`inline-block text-[10px] font-extrabold tracking-[2px] uppercase px-[10px] py-[4px] rounded-[2px] mb-[20px] ${p.tagClass}`}>
                {p.tag}
              </span>
              <div className="text-[60px] font-black text-white/5 leading-none mb-[-10px]">{p.num}</div>
              <div className="text-[18px] font-extrabold mb-[14px] leading-[1.3]">{p.name}</div>
              <div className="text-[13.5px] text-ncn-gray leading-[1.7] mb-[24px]">{p.desc}</div>
              
              <ul className="list-none mb-[28px]">
                {p.features.map((feat, fidx) => (
                  <li key={fidx} className="text-[12.5px] text-[#aaa] py-[5px] border-b border-white/5 flex items-center gap-2">
                    <span className="text-ncn-orange font-bold text-[11px]">→</span>
                    {feat}
                  </li>
                ))}
              </ul>
              
              <Link 
                href={p.btnLink}
                className={`inline-flex items-center gap-2 px-[24px] py-[12px] rounded-[3px] font-bold text-[13px] transition-colors ${p.btnClass}`}
              >
                {p.btnText}
              </Link>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
