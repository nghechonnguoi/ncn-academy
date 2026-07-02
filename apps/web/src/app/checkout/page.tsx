"use client";

import { Suspense } from "react";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Check, Tag, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { paymentsApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const PLANS: Record<string, { name: string; price: number; features: string[] }> = {
  pro: {
    name: "Gói Pro",
    price: 299000,
    features: [
      "Báo cáo PDF Premium độc bản 100%",
      "TOP 5 nghề + phân tích MBTI",
      "AI Advisor (50 tin/tháng)",
      "Lộ trình thăng tiến",
      "Ma trận thu nhập",
    ],
  },
};

function CheckoutForm() {
  const params = useSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const planKey = params.get("plan") ?? "pro";
  const plan = PLANS[planKey] ?? PLANS.pro;
  const affiliateCode = params.get("ref") ?? "";

  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const discount = couponApplied ? Math.round(plan.price * 0.2) : 0;

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      router.push(`/auth/login?callbackUrl=/checkout?plan=${planKey}`);
      return;
    }
    setIsLoading(true);
    try {
      const { url } = await paymentsApi.createCheckout(planKey, affiliateCode || coupon || undefined);
      if (url) window.location.href = url;
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Có lỗi xảy ra, vui lòng thử lại";
      toast({ title: "Lỗi thanh toán", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="w-8 h-8 rounded-lg bg-[#635bff] flex items-center justify-center text-white text-sm">🧭</span>
            <span>NCN<span className="text-[#635bff]">Academy</span></span>
          </Link>
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Lock className="w-4 h-4 text-green-500" />
            Thanh toán bảo mật SSL
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-5xl px-6 py-12">
        <div className="grid md:grid-cols-5 gap-8">
          {/* Form — 3/5 */}
          <div className="md:col-span-3 space-y-6">
            <h1 className="text-2xl font-black text-gray-900">Thông tin thanh toán</h1>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#635bff]" />
                Mã giảm giá / Mã affiliate
              </h2>
              <div className="flex gap-2">
                <Input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                  placeholder="Nhập mã (VD: NCN20)" className="rounded-xl flex-1" />
                <Button variant="outline" className="rounded-xl border-[#635bff] text-[#635bff] hover:bg-[#635bff]/5"
                  onClick={() => setCouponApplied(coupon.length > 0)}>
                  Áp dụng
                </Button>
              </div>
              {couponApplied && (
                <p className="text-green-600 text-xs mt-2 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Mã giảm giá hợp lệ! Giảm 20%
                </p>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#635bff] text-white text-xs flex items-center justify-center font-black">2</span>
                Phương thức thanh toán
              </h2>
              <div className="border-2 border-[#635bff] rounded-xl p-4 bg-[#635bff]/3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-4 h-4 rounded-full border-2 border-[#635bff] bg-[#635bff] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                  <span className="font-medium text-gray-900 text-sm">Thẻ tín dụng / Ghi nợ qua Stripe</span>
                  <div className="ml-auto flex gap-1">
                    {["VISA", "MC", "JCB"].map((b) => (
                      <Badge key={b} variant="secondary" className="text-xs px-1.5 py-0">{b}</Badge>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500 ml-7">
                  Bạn sẽ được chuyển đến trang thanh toán bảo mật của Stripe sau khi nhấn nút bên dưới.
                </p>
              </div>
            </div>
          </div>

          {/* Order summary — 2/5 */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-6">
              <h2 className="font-bold text-gray-900 mb-5">Đơn hàng</h2>

              <div className="mb-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{plan.name}</p>
                    <p className="text-xs text-gray-400">Thanh toán một lần · Vĩnh viễn</p>
                  </div>
                  <p className="font-bold text-gray-900">{plan.price.toLocaleString("vi-VN")}đ</p>
                </div>
                <ul className="space-y-2 mb-4">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-500">
                      <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2 text-sm mb-5">
                <div className="flex justify-between text-gray-500">
                  <span>Tạm tính</span>
                  <span>{plan.price.toLocaleString("vi-VN")}đ</span>
                </div>
                {couponApplied && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá (20%)</span>
                    <span>-{discount.toLocaleString("vi-VN")}đ</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-gray-900 text-base pt-2 border-t border-gray-100">
                  <span>Tổng cộng</span>
                  <span className="text-[#635bff]">{(plan.price - discount).toLocaleString("vi-VN")}đ</span>
                </div>
              </div>

              <Button className="w-full bg-[#635bff] hover:bg-[#5248e8] text-white rounded-xl py-3 font-bold h-auto"
                onClick={handleCheckout} disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {isAuthenticated ? "Thanh toán qua Stripe" : "Đăng nhập để thanh toán"}
                {!isLoading && <ArrowRight className="ml-2 w-4 h-4" />}
              </Button>

              <div className="mt-4 flex flex-col gap-1.5">
                {[
                  { icon: Shield, text: "Bảo mật 256-bit SSL" },
                  { icon: Lock, text: "Không lưu thông tin thẻ" },
                  { icon: Check, text: "Hoàn tiền 7 ngày nếu không hài lòng" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                    <item.icon className="w-3.5 h-3.5 text-gray-300" />
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#635bff]" />
      </div>
    }>
      <CheckoutForm />
    </Suspense>
  );
}
