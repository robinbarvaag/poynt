"use client";

import { Pill } from "@payloadcms/ui";
import Link from "next/link";
import type { MemberListItem } from "../../views/members/list";
type PillStyle = "success" | "error" | "warning" | "light" | "dark";

const tierLabels: Record<string, string> = {
  none: "Ingen",
  community: "Community",
  community_ai: "Community + AI",
};

const statusLabels: Record<string, string> = {
  active: "Aktiv",
  inactive: "Inaktiv",
  canceled: "Kansellert",
  past_due: "Forfalt",
};

const statusStyles: Record<string, PillStyle> = {
  active: "success",
  inactive: "light",
  canceled: "warning",
  past_due: "error",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const MemberTable = ({ members }: { members: MemberListItem[] }) => {
  return (
    <div
      style={{
        overflowX: "auto",
        border: "1px solid var(--theme-elevation-150)",
        borderRadius: "var(--style-radius-s)",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "var(--font-body-size)",
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: "1px solid var(--theme-elevation-150)",
              textAlign: "left",
            }}
          >
            <th style={thStyle}>Namn</th>
            <th style={thStyle}>E-post</th>
            <th style={thStyle}>Tier</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Registrert</th>
            <th style={thStyle}>Siste innlogging</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr
              key={member.id}
              style={{
                borderBottom: "1px solid var(--theme-elevation-100)",
              }}
            >
              <td style={tdStyle}>
                <Link
                  href={`/admin/medlemmer/${member.id}`}
                  style={{
                    color: "var(--theme-text)",
                    textDecoration: "none",
                    fontWeight: 500,
                  }}
                >
                  {member.name || member.email}
                </Link>
              </td>
              <td style={tdStyle}>
                {member.name ? (
                  <span style={{ color: "var(--theme-elevation-500)" }}>
                    {member.email}
                  </span>
                ) : (
                  <span
                    style={{
                      color: "var(--theme-elevation-400)",
                      fontStyle: "italic",
                    }}
                  >
                    (vist som namn)
                  </span>
                )}
              </td>
              <td style={tdStyle}>
                <Pill pillStyle="dark" size="small">
                  {tierLabels[member.tier] ?? member.tier}
                </Pill>
              </td>
              <td style={tdStyle}>
                <Pill
                  pillStyle={statusStyles[member.status] ?? "light"}
                  size="small"
                >
                  {statusLabels[member.status] ?? member.status}
                </Pill>
              </td>
              <td style={tdStyle}>{formatDate(member.createdAt)}</td>
              <td style={tdStyle}>{formatDate(member.lastLogin)}</td>
            </tr>
          ))}
          {members.length === 0 && (
            <tr>
              <td colSpan={6} style={{ ...tdStyle, textAlign: "center" }}>
                Ingen medlemmer funne
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const thStyle: React.CSSProperties = {
  padding: "0.75rem 1rem",
  fontWeight: 600,
  whiteSpace: "nowrap",
  color: "var(--theme-elevation-500)",
  fontSize: "0.8125rem",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const tdStyle: React.CSSProperties = {
  padding: "0.75rem 1rem",
  whiteSpace: "nowrap",
};
