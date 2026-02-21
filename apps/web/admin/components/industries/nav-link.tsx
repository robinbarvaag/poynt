"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const IndustriesNavLink = () => {
  const pathname = usePathname();
  const isActive = pathname?.startsWith("/admin/bransjar");

  return (
    <div style={{ padding: "0 var(--gutter-h)" }}>
      <Link
        href="/admin/bransjar"
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
          <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
          <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
          <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
          <path d="M10 6h4" />
          <path d="M10 10h4" />
          <path d="M10 14h4" />
          <path d="M10 18h4" />
        </svg>
        Bransjar
      </Link>
    </div>
  );
};
