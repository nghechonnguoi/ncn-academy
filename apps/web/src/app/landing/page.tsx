import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Star, Shield, Zap, Users, BarChart3, Brain } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Định Vị Sự Nghiệp Với Khoa Học",
  description: "Hệ thống phân tích nghề nghiệp đa biến — Holland RIASEC + MBTI + AI",
};

const features = [
  {
    icon: Brain,
    title: "Phân tích RIASEC Holland",
    desc: "60 câu hỏi chuẩn hóa khoa học, xác định nhóm nghề phù hợp nhất",
  },
  {
    icon: Zap,
    title: "AI GPT-4o Phân Tích",
    desc: "Thuật toán AI đối chiếu 100+ biến số để đưa ra kết quả chính xác nhất",
  },
  {
    icon: BarChart3,
    title: "Báo Cáo 15 Trang",
    desc: "PDF cá nhân hóa hoàn toàn: lộ trình thăng tiến, ma trận thu nhập",
  },
  {
    icon: Users,
    title: "Cộng Đồng Học Viên",
    desc: "Kết nối với 5.000+ học viên cùng định hướng nghề nghiệp",
  },
];

const testimonials = [
  { name: "Minh Khoa", role: "Sinh viên ĐH Bách Khoa", text: "Kết quả chính xác đến mức tôi không ngờ. Đã chọn đúng ngành Data Science!", rating: 5 },
  { name: "Thanh Thảo", role: "Học sinh lớp 12", text: "Báo cáo chi tiết hơn tôi nghĩ. Từng trang đều có insight thực sự hữu ích.", rating: 5 },
  { name: "Hoàng Nam", role: "Sinh viên năm 2", text: "Lần đầu tiên tôi hiểu thực sự mình phù hợp với nghề gì. Rất đáng tiền!", rating: 5 },
];

export default function LandingPage() {
  return (
    <main className="bg-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 text-center bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto max-w-4xl">
          <Badge className="mb-6 bg-ncn-purple/10 text-ncn-purple border-ncn-purple/20 rounded-full px-4 py-1.5">
            🎯 5.000+ học viên đã định vị thành công
          </Badge>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight text-gray-900 leading-tight">
            Biết mình là ai.
            <br />
            <span className="gradient-text">Chọn đúng nghề. Thành công.</span>
          </h1>
          <p className="mt-6 text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Hệ thống phân tích nghề nghiệp đa biến kết hợp Holland RIASEC, MBTI, Nhân số học Ikigai và AI GPT-4o — nhận báo cáo 15 trang cá nhân hóa trong 10 phút.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/login">
              <Button size="lg" className="bg-ncn-purple hover:bg-ncn-purple-dark text-white rounded-full px-8 font-semibold shadow-lg shadow-ncn-purple/25">
                Làm bài khảo sát
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/sales">
              <Button size="lg" variant="outline" className="rounded-full px-8 border-gray-200">
                Xem bảng giá PDF Premium
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-400">Miễn phí · Không cần thẻ tín dụng · Kết quả ngay lập tức</p>
        </div>
      </section>

      {/* Trust logos */}
      <section className="py-14 px-6 border-y border-gray-100">
        <div className="container mx-auto text-center">
          <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-8">Được tin tưởng bởi học sinh, sinh viên từ</p>
          <div className="flex flex-wrap justify-center gap-8 items-center opacity-50">
            {["ĐH Bách Khoa", "ĐH Kinh tế", "NEU", "FPT", "RMIT", "UEL"].map((uni) => (
              <span key={uni} className="text-gray-500 font-bold text-lg">{uni}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-ncn-purple uppercase tracking-widest mb-3">Tính năng</p>
            <h2 className="text-4xl font-black text-gray-900">Tại sao chọn NCN Academy?</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={i} className="stripe-card rounded-2xl p-6 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-xl bg-ncn-purple/10 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-ncn-purple" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="container mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold text-ncn-purple uppercase tracking-widest mb-3">Quy trình</p>
          <h2 className="text-4xl font-black text-gray-900 mb-16">Chỉ 4 bước — 10 phút</h2>
          <div className="grid md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-8 left-[12%] right-[12%] h-px bg-gray-200" />
            {[
              { step: "01", title: "Nhập thông tin", desc: "Họ tên, ngày sinh, email" },
              { step: "02", title: "Làm bài test", desc: "60 câu hỏi chuẩn hóa" },
              { step: "03", title: "AI phân tích", desc: "Thuật toán đa biến" },
              { step: "04", title: "Nhận kết quả", desc: "Báo cáo PDF 15 trang" },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-ncn-purple text-white flex items-center justify-center font-black text-xl mb-4 relative z-10 shadow-lg shadow-ncn-purple/30">
                  {s.step}
                </div>
                <h3 className="font-bold text-gray-900">{s.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-ncn-purple uppercase tracking-widest mb-3">Phản hồi</p>
            <h2 className="text-4xl font-black text-gray-900">Học viên nói gì?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="stripe-card rounded-2xl p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4 italic">"{t.text}"</p>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 bg-ncn-purple">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-black text-white mb-4">Sẵn sàng định vị tương lai?</h2>
          <p className="text-purple-200 mb-8">Miễn phí · Không cần thẻ · Kết quả ngay lập tức</p>
          <Link href="/auth/login">
            <Button size="lg" className="bg-white text-ncn-purple hover:bg-gray-100 rounded-full px-10 font-bold text-base">
              Bắt đầu ngay hôm nay
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <div className="mt-8 flex justify-center gap-6 text-purple-200 text-sm">
            <span className="flex items-center gap-1"><Shield className="w-4 h-4" /> Bảo mật tuyệt đối</span>
            <span className="flex items-center gap-1"><Check className="w-4 h-4" /> Không spam</span>
            <span className="flex items-center gap-1"><Zap className="w-4 h-4" /> Kết quả ngay</span>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
