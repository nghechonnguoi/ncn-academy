import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Bảng Giá — Chọn Gói Phù Hợp" };

const plans = [
  {
    name: "Miễn Phí",
    price: "0đ",
    period: "mãi mãi",
    desc: "Khám phá kết quả cơ bản",
    cta: "Bắt đầu miễn phí",
    href: "/auth/login",
    highlight: false,
    features: [
      { text: "Bài test RIASEC Holland", included: true },
      { text: "TOP 3 nghề nghiệp gợi ý", included: true },
      { text: "Kết quả tổng quan", included: true },
      { text: "Báo cáo PDF Premium", included: false },
      { text: "Phân tích MBTI chuyên sâu", included: false },
      { text: "AI Advisor cá nhân", included: false },
      { text: "Lộ trình thăng tiến chi tiết", included: false },
      { text: "Ma trận thu nhập", included: false },
    ],
  },
  {
    name: "Pro",
    price: "299.000đ",
    period: "một lần",
    desc: "Báo cáo đầy đủ + Chuyên gia tư vấn ảo",
    cta: "Mua ngay",
    href: "/dashboard",
    highlight: true,
    badge: "Phổ biến nhất",
    features: [
      { text: "Bài test RIASEC Holland", included: true },
      { text: "TOP 5 nghề nghiệp + ngách", included: true },
      { text: "Kết quả tổng quan", included: true },
      { text: "Báo cáo PDF Premium", included: true },
      { text: "Phân tích MBTI chuyên sâu", included: true },
      { text: "AI Advisor (50 tin nhắn)", included: true },
      { text: "Lộ trình thăng tiến chi tiết", included: true },
      { text: "Ma trận thu nhập 5 nghề", included: true },
    ],
  },
  {
    name: "Enterprise",
    price: "Liên hệ",
    period: "theo đơn vị",
    desc: "Cho trường học & tổ chức",
    cta: "Liên hệ ngay",
    href: "mailto:info@nghechonnguoi.com",
    highlight: false,
    features: [
      { text: "Tất cả tính năng Pro", included: true },
      { text: "Dashboard quản lý học sinh", included: true },
      { text: "API tích hợp hệ thống", included: true },
      { text: "Báo cáo analytics tổng hợp", included: true },
      { text: "AI không giới hạn", included: true },
      { text: "Hỗ trợ triển khai tận nơi", included: true },
      { text: "SLA 99.9% uptime", included: true },
      { text: "Dedicated account manager", included: true },
    ],
  },
];

const faqs = [
  { q: "Bài test mất bao lâu?", a: "Khoảng 8–12 phút. Gồm 40+ câu hỏi được thiết kế để đo lường xu hướng nghề nghiệp chính xác nhất." },
  { q: "Kết quả có chính xác không?", a: "Hệ thống dựa trên các mô hình phân tích tâm lý học được nghiên cứu khoa học chuyên sâu và được chuẩn hóa theo dữ liệu thị trường Việt Nam." },
  { q: "Tôi có thể làm bài nhiều lần không?", a: "Có thể làm lại sau 6 tháng để so sánh sự thay đổi xu hướng nghề nghiệp theo thời gian." },
  { q: "Thanh toán qua đâu?", a: "Stripe — hỗ trợ Visa, Mastercard, JCB. Hoặc chuyển khoản ngân hàng." },
];

export default function SalesPage() {
  return (
    <main className="bg-white">
      <Navbar />

      {/* Header */}
      <section className="pt-32 pb-16 px-6 text-center bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto max-w-3xl">
          <Badge className="mb-5 bg-ncn-purple/10 text-ncn-purple border-ncn-purple/20 rounded-full">
            💳 Thanh toán an toàn qua Stripe
          </Badge>
          <h1 className="text-5xl font-black text-gray-900 tracking-tight">Chọn gói phù hợp</h1>
          <p className="mt-4 text-lg text-gray-500">Miễn phí để bắt đầu. Nâng cấp khi bạn muốn báo cáo chuyên sâu hơn.</p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "relative rounded-2xl p-8 border",
                  plan.highlight
                    ? "bg-ncn-purple text-white border-ncn-purple shadow-2xl shadow-ncn-purple/25 scale-[1.02]"
                    : "bg-white border-gray-200 stripe-card"
                )}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-amber-400 text-amber-900 border-0 px-4 py-1 rounded-full font-bold">
                      <Zap className="w-3 h-3 mr-1" />
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                <div className="mb-6">
                  <p className={cn("text-sm font-semibold uppercase tracking-wide mb-1", plan.highlight ? "text-purple-200" : "text-ncn-purple")}>
                    {plan.name}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className={cn("text-4xl font-black", plan.highlight ? "text-white" : "text-gray-900")}>
                      {plan.price}
                    </span>
                    <span className={cn("text-sm", plan.highlight ? "text-purple-200" : "text-gray-400")}>
                      /{plan.period}
                    </span>
                  </div>
                  <p className={cn("text-sm mt-2", plan.highlight ? "text-purple-200" : "text-gray-500")}>{plan.desc}</p>
                </div>

                <Link href={plan.href}>
                  <Button
                    className={cn(
                      "w-full rounded-xl font-semibold mb-6",
                      plan.highlight
                        ? "bg-white text-ncn-purple hover:bg-gray-100"
                        : "bg-ncn-purple text-white hover:bg-ncn-purple-dark"
                    )}
                  >
                    {plan.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>

                <ul className="space-y-3">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3">
                      {f.included ? (
                        <Check className={cn("w-4 h-4 mt-0.5 flex-shrink-0", plan.highlight ? "text-green-300" : "text-green-500")} />
                      ) : (
                        <X className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-300" />
                      )}
                      <span className={cn("text-sm", f.included ? (plan.highlight ? "text-white" : "text-gray-700") : "text-gray-400")}>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guarantee */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="text-5xl mb-4">🛡️</div>
          <h2 className="text-2xl font-black text-gray-900 mb-3">Đảm bảo hoàn tiền 7 ngày</h2>
          <p className="text-gray-500">Nếu bạn không hài lòng với kết quả trong vòng 7 ngày, chúng tôi hoàn tiền 100% — không hỏi lý do.</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-black text-gray-900 mb-10 text-center">Câu hỏi thường gặp</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="stripe-card rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
