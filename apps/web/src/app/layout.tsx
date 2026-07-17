import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";
import { ReferralCapture } from "@/components/ReferralCapture";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "NCN Academy — Hệ Thống Định Vị Sự Nghiệp",
    template: "%s | NCN Academy",
  },
  description:
    "Hệ thống phân tích nghề nghiệp đa biến hàng đầu Việt Nam. Kết hợp các công cụ khoa học chuyên sâu để định vị chính xác con đường sự nghiệp phù hợp nhất với bạn.",
  keywords: ["định hướng nghề nghiệp", "trắc nghiệm tính cách", "chọn ngành", "tư vấn nghề nghiệp", "AI"],
  authors: [{ name: "NCN Academy" }],
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "https://nghechonnguoi.com",
    siteName: "NCN Academy",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans bg-[#111] text-white overflow-x-hidden`}>
        <Providers>
          {/* Bắt ?ref= từ URL ở bất kỳ trang nào, lưu vào localStorage */}
          <Suspense fallback={null}>
            <ReferralCapture />
          </Suspense>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
