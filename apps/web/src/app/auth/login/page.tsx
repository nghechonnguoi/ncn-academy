"use client";

import { Suspense } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Chrome, Mail, Lock, Eye, EyeOff, ArrowRight, User, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";
  const { login, register } = useAuth();

  const [tab, setTab] = useState<"login" | "register">("login");
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "", email: "", password: "", referralCode: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (tab === "login") {
        await login(form.email, form.password);
        document.cookie = "ncn_auth=1; path=/; max-age=2592000; SameSite=Lax";
        toast({ title: "Đăng nhập thành công!", variant: "success" as any });
        router.push(callbackUrl);
      } else {
        if (!form.name.trim()) { setError("Vui lòng nhập họ tên"); return; }
        await register(form.name, form.email, form.password, form.referralCode || undefined);
        document.cookie = "ncn_auth=1; path=/; max-age=2592000; SameSite=Lax";
        toast({ title: "Tạo tài khoản thành công!", description: "Chào mừng bạn đến NCN Academy 🎉" });
        router.push("/assessment");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? (tab === "login" ? "Email hoặc mật khẩu không đúng" : "Có lỗi xảy ra, vui lòng thử lại");
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl">
            <span className="w-10 h-10 rounded-xl bg-[#635bff] flex items-center justify-center text-white text-lg">🧭</span>
            <span>NCN<span className="text-[#635bff]">Academy</span></span>
          </Link>
          <p className="text-gray-500 mt-2 text-sm">Định vị sự nghiệp với khoa học &amp; AI</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-gray-100/50 border border-gray-100 overflow-hidden">
          {/* Tabs */}
          <div className="flex">
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(""); }}
                className={`flex-1 py-4 text-sm font-semibold transition-all border-b-2 ${
                  tab === t ? "text-[#635bff] border-[#635bff]" : "text-gray-400 border-transparent hover:text-gray-600"
                }`}
              >
                {t === "login" ? "Đăng nhập" : "Đăng ký"}
              </button>
            ))}
          </div>

          <div className="p-8">
            <Button
              variant="outline"
              className="w-full rounded-xl border-gray-200 py-3 font-medium hover:border-gray-300 transition-all"
              type="button"
              disabled
            >
              <Chrome className="w-4 h-4 mr-2" />
              Tiếp tục với Google
              <span className="ml-auto text-xs text-gray-300">(Sắp ra mắt)</span>
            </Button>

            <div className="relative my-6">
              <Separator />
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-gray-400">hoặc</span>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {tab === "register" && (
                <div>
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">Họ và tên</Label>
                  <div className="relative mt-1.5">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input id="name" name="name" value={form.name} onChange={handleChange}
                      placeholder="Nguyễn Văn A" className="pl-10 rounded-xl border-gray-200" required />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input id="email" name="email" type="email" value={form.email} onChange={handleChange}
                    placeholder="email@example.com" className="pl-10 rounded-xl border-gray-200" required />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">Mật khẩu</Label>
                  {tab === "login" && (
                    <Link href="/auth/forgot-password" className="text-xs text-[#635bff] hover:underline">Quên mật khẩu?</Link>
                  )}
                </div>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input id="password" name="password" type={showPass ? "text" : "password"} value={form.password} onChange={handleChange}
                    placeholder="••••••••" className="pl-10 pr-10 rounded-xl border-gray-200" minLength={8} required />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {tab === "register" && (
                <div>
                  <Label htmlFor="referralCode" className="text-sm font-medium text-gray-700">
                    Mã giới thiệu <span className="text-gray-400 font-normal">(tuỳ chọn)</span>
                  </Label>
                  <Input id="referralCode" name="referralCode" value={form.referralCode} onChange={handleChange}
                    placeholder="Mã affiliate của người giới thiệu" className="mt-1.5 rounded-xl border-gray-200 uppercase" />
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <Button type="submit" disabled={isLoading}
                className="w-full bg-[#635bff] hover:bg-[#5248e8] text-white rounded-xl py-3 font-semibold h-auto">
                {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {tab === "login" ? "Đăng nhập" : "Tạo tài khoản"}
                {!isLoading && <ArrowRight className="ml-2 w-4 h-4" />}
              </Button>
            </form>

            {tab === "register" && (
              <p className="text-xs text-gray-400 text-center mt-4">
                Bằng cách đăng ký, bạn đồng ý với{" "}
                <Link href="/terms" className="text-[#635bff] hover:underline">Điều khoản</Link>{" "}và{" "}
                <Link href="/privacy" className="text-[#635bff] hover:underline">Chính sách bảo mật</Link>
              </p>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">© 2026 NCN Academy · Bảo mật theo chuẩn PDPA</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#635bff]" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
