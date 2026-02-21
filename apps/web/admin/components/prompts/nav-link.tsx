"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const PromptsNavLink = () => {
  const pathname = usePathname();
  const isActive = pathname?.startsWith("/admin/prompts");

  return (
    <div style={{ padding: "0 var(--gutter-h)" }}>
      <Link
        href="/admin/prompts"
        className={`nav__link ${isActive ? "active" : ""}`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.5rem 0",
          color: isActive ? "var(--theme-text)" : "var(--theme-elevation-500)",
          textDecoration: "none",
          fontSize: "var(--font-body-size)",
          fontWeight: isActive ? 600 : 400,
          transition: "color 0.15s ease",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" x2="8" y1="13" y2="13" />
          <line x1="16" x2="8" y1="17" y2="17" />
          <line x1="10" x2="8" y1="9" y2="9" />
        </svg>
        Prompt-malar
      </Link>
    </div>
  );
};
