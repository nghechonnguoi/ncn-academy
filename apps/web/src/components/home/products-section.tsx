"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const PRODUCTS = [
  {
    num: "01",
    tag: "✅ Đang hoạt động",
    tagClass: "bg-ncn-orange/15 text-ncn-orange border border-ncn-orange/40",
    name: "Định Vị Nghề Nghiệp Ikigai",
    desc: "Hệ thống phân tích đa chiều kết hợp Nhân số học, RIASEC Holland, MBTI và Ikigai — gợi ý TOP 5 nghề nghiệp phù hợp nhất với con người thật của bạn.",
    features: [
      "Phân tích 60+ câu hỏi chuyên sâu",
      "Kết hợp 4 bộ công cụ tâm lý học",
      "Gợi ý tổ hợp môn xét tuyển ĐH",
      "Báo cáo cá nhân hóa chi tiết",
    ],
    btnText: "Làm bài khảo sát miễn phí →",
    btnLink: "https://quiz.nghechonnguoi.com",
    btnClass: "bg-ncn-orange text-white hover:bg-ncn-orange-dark",
    featured: true,
  },
  {
    num: "02",
    tag: "🔜 Sắp ra mắt",
    tagClass: "bg-white/10 text-ncn-gray border border-white/15",
    name: "Test Năng Lực Tư Duy",
    desc: "Đánh giá chỉ số IQ, EQ, tư duy phản biện và khả năng giải quyết vấn đề — bức tranh toàn diện về trí tuệ của bạn.",
    features: [
      "Bài test IQ chuẩn quốc tế",
      "Đánh giá chỉ số EQ",
      "Phân tích điểm mạnh tư duy",
      "Lộ trình cải thiện cá nhân",
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
    name: "Lộ Trình Học Tập Cá Nhân",
    desc: "Dựa trên điểm mạnh và nghề nghiệp mục tiêu, hệ thống tạo ra lộ trình học tập tối ưu từng bước, từng giai đoạn, đo lường được.",
    features: [
      "Lộ trình 3–5 năm chi tiết",
      "Gợi ý khóa học và tài liệu",
      "Theo dõi tiến độ realtime",
      "Mentor matching AI",
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
