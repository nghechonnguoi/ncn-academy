/**
 * useReferral — Hook đọc affiliate referral code
 *
 * Ưu tiên:
 *  1. ?ref= trong URL hiện tại (cao nhất, luôn ghi đè)
 *  2. sessionStorage['ncn_ref'] (lưu từ lần trước trong cùng session)
 *  3. localStorage['ncn_referral_code'] (tương thích với script.js cũ trên quiz-site)
 */
"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "ncn_ref";
const LOCAL_KEY   = "ncn_referral_code"; // key cũ của script.js

export function useReferral() {
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    // 1. Đọc từ URL params (?ref=CODE)
    const urlParams = new URLSearchParams(window.location.search);
    const refFromUrl = urlParams.get("ref");

    if (refFromUrl) {
      const code = refFromUrl.trim().toUpperCase();
      // Lưu vào cả sessionStorage lẫn localStorage để persist
      try {
        sessionStorage.setItem(SESSION_KEY, code);
        localStorage.setItem(LOCAL_KEY, code);
      } catch {}
      setReferralCode(code);
      return;
    }

    // 2. Đọc từ sessionStorage
    try {
      const fromSession = sessionStorage.getItem(SESSION_KEY);
      if (fromSession) {
        setReferralCode(fromSession);
        return;
      }
    } catch {}

    // 3. Fallback: đọc từ localStorage (tương thích với script.js cũ)
    try {
      const fromLocal = localStorage.getItem(LOCAL_KEY);
      if (fromLocal) {
        // Migrate vào sessionStorage để chuẩn hóa
        sessionStorage.setItem(SESSION_KEY, fromLocal);
        setReferralCode(fromLocal);
      }
    } catch {}
  }, []);

  return referralCode;
}

/**
 * Đọc referral code một lần (không dùng hook — dùng trong event handlers)
 */
export function getReferralCodeOnce(): string | null {
  try {
    return (
      sessionStorage.getItem(SESSION_KEY) ||
      localStorage.getItem(LOCAL_KEY) ||
      null
    );
  } catch {
    return null;
  }
}
