"use client";

import { motion } from "framer-motion";

const TESTIMONIALS = [
  {
    text: "Kết quả phân tích chính xác đến mức tôi không thể ngờ. Bài khảo sát đã chỉ ra đúng điểm mạnh tôi chưa nhận ra — tư duy hệ thống và khả năng phân tích dữ liệu. Hiện tôi đang học ngành Data Science và thấy rất đúng hướng.",
    authorName: "Minh Khoa",
    authorRole: "Sinh viên năm 1, ĐH Bách Khoa TP.HCM",
    avatar: "M",
  },
  {
    text: "Trước khi làm bài test, tôi còn chưa biết mình hợp với gì. Sau khi nhận báo cáo, lộ trình nghề nghiệp hiện ra rõ ràng đến từng bước. Tôi quyết định chọn ngành Marketing và rất hài lòng với quyết định đó.",
    authorName: "Thanh Thảo",
    authorRole: "Học sinh lớp 12, Trường THPT Nguyễn Du",
    avatar: "T",
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="bg-ncn-black py-[100px] px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-[56px] gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-extrabold tracking-[3px] text-ncn-orange uppercase mb-4">
              <span className="w-6 h-[2px] bg-ncn-orange" />
              Phản hồi học viên
            </div>
            <h2 className="text-[clamp(32px,4vw,52px)] font-black leading-[1.1] tracking-[-1px]">
              ĐƯỢC TIN TƯỞNG BỞI<br />
              <span className="text-ncn-orange">HỌC VIÊN CỦA CHÚNG TÔI</span>
            </h2>
          </div>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-[2px] bg-white/5"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          {TESTIMONIALS.map((t, idx) => (
            <div 
              key={idx}
              className="bg-ncn-black p-[40px_36px]"
            >
              <div className="text-[48px] text-ncn-orange leading-none mb-[16px] font-serif">"</div>
              <div className="text-[15px] text-ncn-gray-light leading-[1.75] mb-[28px] italic">
                {t.text}
              </div>
              <div className="flex items-center gap-[14px]">
                <div className="w-[44px] h-[44px] rounded-full bg-ncn-orange flex items-center justify-center font-extrabold text-[16px] shrink-0 text-white">
                  {t.avatar}
                </div>
                <div>
                  <div className="text-[14px] font-bold text-white">{t.authorName}</div>
                  <div className="text-[12px] text-ncn-gray mt-[2px]">{t.authorRole}</div>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
