"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const MembersNavLink = () => {
  const pathname = usePathname();
  const isActive = pathname?.startsWith("/admin/medlemmer");

  return (
    <div style={{ padding: "0 var(--gutter-h)" }}>
      <Link
        href="/admin/medlemmer"
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
          aria-hidden="true"
          focusable={false}
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        Medlemmer
      </Link>
    </div>
  );
};
