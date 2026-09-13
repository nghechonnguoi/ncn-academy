"use client";

import { useState } from "react";

export function ContactFollower() {
  const [expanded, setExpanded] = useState(false);

  const phoneNumber = "0986864591";
  const zaloLink = `https://zalo.me/${phoneNumber}`;

  return (
    <>
      {/* Fixed clickable button */}
      <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 10000, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
        <button
          onClick={() => setExpanded((v) => !v)}
          aria-label="Liên hệ Admin"
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 32px rgba(14,165,233,0.5)",
            animation: "ncn-float 3s ease-in-out infinite",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.57 21 3 13.43 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.25 1.01L6.62 10.79z"
              fill="white"
            />
          </svg>
        </button>

        {/* Label below phone button */}
        <div
          style={{
            background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
            borderRadius: "999px",
            padding: "5px 12px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "0 4px 16px rgba(14,165,233,0.4)",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#fff",
              display: "inline-block",
              boxShadow: "0 0 0 0 rgba(255,255,255,0.7)",
              animation: "ncn-pulse 1.4s infinite",
              flexShrink: 0,
            }}
          />
          <span style={{ color: "#fff", fontWeight: 700, fontSize: "12px" }}>
            Liên hệ Admin
          </span>
          <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "11px", fontWeight: 500 }}>
            {phoneNumber}
          </span>
          <span
            style={{
              background: "rgba(255,255,255,0.2)",
              borderRadius: "5px",
              padding: "1px 6px",
              fontSize: "10px",
              fontWeight: 700,
              color: "#fff",
            }}
          >
            Zalo
          </span>
        </div>

        {/* Expandable panel */}
        <div
          style={{
            position: "absolute",
            bottom: 68,
            right: 0,
            background: "rgba(17,17,40,0.97)",
            border: "1px solid rgba(99,102,241,0.35)",
            borderRadius: "16px",
            padding: "20px",
            minWidth: "220px",
            boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
            backdropFilter: "blur(16px)",
            opacity: expanded ? 1 : 0,
            pointerEvents: expanded ? "all" : "none",
            transform: expanded ? "translateY(0) scale(1)" : "translateY(12px) scale(0.95)",
            transition: "opacity 0.25s ease, transform 0.25s ease",
            transformOrigin: "bottom right",
          }}
        >
          <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 700, color: "#6366f1", letterSpacing: "1px", textTransform: "uppercase" }}>
            Liên hệ hỗ trợ
          </p>
          <p style={{ margin: "0 0 16px", fontSize: "13px", color: "rgba(255,255,255,0.55)" }}>
            Admin NCN Academy
          </p>

          <a
            href={`tel:${phoneNumber}`}
            style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "10px 14px", borderRadius: "10px",
              background: "rgba(14,165,233,0.12)", border: "1px solid rgba(14,165,233,0.25)",
              color: "#38bdf8", textDecoration: "none", fontWeight: 600, fontSize: "15px",
              marginBottom: "8px",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.57 21 3 13.43 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.25 1.01L6.62 10.79z" fill="#38bdf8" />
            </svg>
            {phoneNumber}
          </a>

          <a
            href={zaloLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "10px 14px", borderRadius: "10px",
              background: "rgba(0,130,255,0.12)", border: "1px solid rgba(0,130,255,0.25)",
              color: "#60a5fa", textDecoration: "none", fontWeight: 600, fontSize: "15px",
            }}
          >
            <span style={{
              width: 18, height: 18, borderRadius: "4px", background: "#0068ff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "11px", fontWeight: 900, color: "#fff", flexShrink: 0,
            }}>
              Z
            </span>
            Zalo: {phoneNumber}
          </a>
        </div>
      </div>

      <style>{`
        @keyframes ncn-pulse {
          0% { box-shadow: 0 0 0 0 rgba(255,255,255,0.7); }
          70% { box-shadow: 0 0 0 8px rgba(255,255,255,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
        }
        @keyframes ncn-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </>
  );
}
