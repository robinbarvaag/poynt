"use client";

import { Pill } from "@payloadcms/ui";
import Link from "next/link";
import type { ApplicationListItem } from "../../views/applications/list";

type PillStyle = "success" | "error" | "warning" | "light" | "dark";

const statusLabels: Record<string, string> = {
  pending: "Til behandling",
  approved: "Godkjent",
  rejected: "Avslått",
};

const statusStyles: Record<string, PillStyle> = {
  pending: "warning",
  approved: "success",
  rejected: "light",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const ApplicationTable = ({
  applications,
}: {
  applications: ApplicationListItem[];
}) => {
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
            <th style={thStyle}>Navn</th>
            <th style={thStyle}>Bedrift</th>
            <th style={thStyle}>E-post</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Mottatt</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((application) => (
            <tr
              key={application.id}
              style={{
                borderBottom: "1px solid var(--theme-elevation-100)",
              }}
            >
              <td style={tdStyle}>
                <Link
                  href={`/admin/soknader/${application.id}`}
                  style={{
                    color: "var(--theme-text)",
                    textDecoration: "none",
                    fontWeight: 500,
                  }}
                >
                  {application.fullName || application.email}
                </Link>
              </td>
              <td style={tdStyle}>
                {application.companyName || (
                  <span style={{ color: "var(--theme-elevation-400)" }}>—</span>
                )}
              </td>
              <td style={tdStyle}>
                <span style={{ color: "var(--theme-elevation-500)" }}>
                  {application.email}
                </span>
              </td>
              <td style={tdStyle}>
                <Pill
                  pillStyle={statusStyles[application.status] ?? "light"}
                  size="small"
                >
                  {statusLabels[application.status] ?? application.status}
                </Pill>
              </td>
              <td style={tdStyle}>{formatDate(application.createdAt)}</td>
            </tr>
          ))}
          {applications.length === 0 && (
            <tr>
              <td colSpan={5} style={{ ...tdStyle, textAlign: "center" }}>
                Ingen søknader ennå
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
