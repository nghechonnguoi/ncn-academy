import Link from "next/link";
import { CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Thanh toán thành công — NCN Academy" };

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-emerald-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-black text-gray-900 mb-3">Thanh toán thành công! 🎉</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Chào mừng bạn đến với NCN Academy Pro! Tài khoản của bạn đã được nâng cấp.
          Báo cáo PDF 15 trang và AI Advisor đã được kích hoạt.
        </p>

        {/* What's next */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-left mb-8 space-y-4">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#635bff]" />
            Bạn có thể làm ngay bây giờ
          </h2>
          {[
            "Làm bài test RIASEC 60 câu để nhận kết quả đầy đủ",
            "Tải xuống báo cáo PDF 15 trang từ Dashboard",
            "Chat với AI Career Advisor — không giới hạn 50 tin",
            "Chia sẻ link affiliate để nhận 20% hoa hồng",
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 text-sm text-gray-600">
              <div className="w-5 h-5 rounded-full bg-[#635bff] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                {i + 1}
              </div>
              {item}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/dashboard">
            <Button className="w-full bg-[#635bff] hover:bg-[#5248e8] text-white rounded-xl h-auto py-3 font-semibold">
              Đến Dashboard của tôi
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          <Link href="/assessment">
            <Button variant="outline" className="w-full rounded-xl h-auto py-3">
              Làm bài test RIASEC ngay
            </Button>
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          Email xác nhận đã được gửi đến hộp thư của bạn.
        </p>
      </div>
    </div>
  );
}
