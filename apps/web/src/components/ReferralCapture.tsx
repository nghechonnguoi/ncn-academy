"use client";

/**
 * ReferralCapture — Component không render gì cả.
 *
 * Mount 1 lần ở root layout để bắt ?ref= từ bất kỳ URL nào
 * trên quiz.nghechonnguoi.com và lưu vào localStorage.
 *
 * Giải quyết bug cross-domain localStorage:
 *   nghechonnguoi.com (GitHub Pages) lưu ref vào localStorage domain đó,
 *   quiz.nghechonnguoi.com (Vercel/Next.js) không đọc được → mất affiliate code.
 *   → Fix: bắt ?ref= ngay trên domain quiz và lưu lại ở đây.
 */

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

// Key chính mới — dùng trong toàn bộ quiz app
export const REFERRAL_LS_KEY = "referralCode";
// Key cũ của script.js bên quiz-site — giữ để tương thích ngược
const LEGACY_LS_KEY = "ncn_referral_code";

export function ReferralCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (!ref) return;

    const code = ref.trim().toUpperCase();
    try {
      localStorage.setItem(REFERRAL_LS_KEY, code);
      localStorage.setItem(LEGACY_LS_KEY, code); // tương thích ngược
    } catch {
      // Private browsing có thể throw — bỏ qua
    }

    if (process.env.NODE_ENV === "development") {
      console.log(`[NCN] Affiliate ref captured: ${code}`);
    }
  }, [searchParams]);

  return null;
}
