/**
 * /ref/[code] — Affiliate landing route
 *
 * Khi affiliate chia sẻ link quiz.nghechonnguoi.com/ref/CODE,
 * trang này sẽ:
 *   1. Lưu CODE vào localStorage (cả key mới & key cũ để tương thích)
 *   2. Redirect sang trang chính (/dashboard hoặc /)
 *
 * Server-side redirect với script-based fallback để đảm bảo
 * localStorage được ghi trước khi rời trang.
 */
"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function RefPage() {
  const router = useRouter();
  const params = useParams();
  const code = (params?.code as string ?? "").trim().toUpperCase();

  useEffect(() => {
    if (code) {
      try {
        // Lưu cả hai key để tương thích với mọi phần của hệ thống
        localStorage.setItem("referralCode", code);          // key mới (ReferralCapture / checkout-modal)
        localStorage.setItem("ncn_referral_code", code);    // key cũ (quiz-site/script.js, useReferral)
        sessionStorage.setItem("ncn_ref", code);            // sessionStorage (useReferral hook)
        // eslint-disable-next-line no-console
        console.log(`[NCN Affiliate] Code captured & stored: ${code}`);
      } catch {
        // Private browsing — bỏ qua
      }
    }

    // Redirect về trang chính sau khi lưu
    router.replace("/");
  }, [code, router]);

  // Hiển thị loading nhẹ trong lúc chờ redirect
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#111",
        color: "#fff",
        flexDirection: "column",
        gap: "12px",
        fontFamily: "sans-serif",
      }}
    >
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#635bff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ animation: "spin 1s linear infinite" }}
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </svg>
      <p style={{ color: "#aaa", fontSize: "14px" }}>Đang chuyển hướng...</p>
    </div>
  );
}
