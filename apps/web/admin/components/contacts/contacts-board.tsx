"use client";

import type { ContactRow } from "@/lib/contacts-overview";
import { useMemo, useState } from "react";

/**
 * Kontakter-brettet: søk + filterknapper over en tabell der hver rad er én
 * person (slått sammen på normalisert e-post), med merker for hvor personen
 * finnes: kunde, nyhetsbrev, medlem, søknad, henvendelse, venteliste.
 */

type Filter =
  | "alle"
  | "kunder"
  | "nyhetsbrev"
  | "medlemmer"
  | "henvendelser"
  | "venteliste";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "alle", label: "Alle" },
  { key: "kunder", label: "Kunder" },
  { key: "nyhetsbrev", label: "Nyhetsbrev" },
  { key: "medlemmer", label: "Medlemmer" },
  { key: "henvendelser", label: "Henvendelser" },
  { key: "venteliste", label: "Venteliste" },
];

function matchesFilter(row: ContactRow, filter: Filter): boolean {
  switch (filter) {
    case "kunder":
      return row.orders.count > 0;
    case "nyhetsbrev":
      return row.newsletter;
    case "medlemmer":
      return Boolean(row.member && row.member.tier !== "none");
    case "henvendelser":
      return row.submissions.count > 0;
    case "venteliste":
      return row.waitlist;
    default:
      return true;
  }
}

function formatDate(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const badgeStyle = (bg: string): React.CSSProperties => ({
  display: "inline-block",
  padding: "0.1rem 0.55rem",
  borderRadius: "999px",
  fontSize: "0.7rem",
  fontWeight: 600,
  background: bg,
  color: "var(--theme-elevation-800)",
  whiteSpace: "nowrap",
});

function Badges({ row }: { row: ContactRow }) {
  const badges: { label: string; bg: string; title?: string }[] = [];
  if (row.orders.count > 0) {
    badges.push({
      label: `Kunde · ${row.orders.count} kjøp (${Math.round(row.orders.totalKr)} kr)`,
      bg: "var(--theme-success-100)",
    });
  }
  if (row.member && row.member.tier !== "none") {
    badges.push({
      label: `Medlem · ${row.member.tier === "community_ai" ? "Community + AI" : "Community"}${row.member.status !== "active" ? ` (${row.member.status})` : ""}`,
      bg: "var(--theme-warning-100)",
    });
  }
  if (row.application) {
    const status =
      row.application.status === "pending"
        ? "venter"
        : row.application.status === "approved"
          ? "godkjent"
          : "avslått";
    badges.push({
      label: `Søknad · ${status}`,
      bg: "var(--theme-elevation-100)",
      title: row.application.companyName,
    });
  }
  if (row.newsletter) {
    badges.push({ label: "Nyhetsbrev", bg: "var(--theme-elevation-100)" });
  }
  if (row.waitlist) {
    badges.push({ label: "Venteliste", bg: "var(--theme-elevation-100)" });
  }
  if (row.submissions.count > 0) {
    badges.push({
      label: `Henvendelser · ${row.submissions.count}`,
      bg: "var(--theme-elevation-100)",
    });
  }
  return (
    <span style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
      {badges.map((badge) => (
        <span
          key={badge.label}
          style={badgeStyle(badge.bg)}
          title={badge.title}
        >
          {badge.label}
        </span>
      ))}
    </span>
  );
}

export function ContactsBoard({ rows }: { rows: ContactRow[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("alle");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (!matchesFilter(row, filter)) return false;
      if (!needle) return true;
      return (
        row.email.toLowerCase().includes(needle) ||
        (row.name ?? "").toLowerCase().includes(needle)
      );
    });
  }, [rows, query, filter]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <input
          type="search"
          placeholder="Søk på navn eller e-post …"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Søk i kontakter"
          style={{
            padding: "0.5rem 0.85rem",
            borderRadius: "8px",
            border: "1px solid var(--theme-elevation-150)",
            background: "var(--theme-input-bg)",
            color: "var(--theme-elevation-800)",
            minWidth: "260px",
            fontSize: "0.9rem",
          }}
        />
        <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
          {FILTERS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setFilter(option.key)}
              style={{
                padding: "0.3rem 0.8rem",
                borderRadius: "999px",
                border: "1px solid var(--theme-elevation-150)",
                cursor: "pointer",
                fontSize: "0.8rem",
                background:
                  filter === option.key
                    ? "var(--theme-elevation-800)"
                    : "transparent",
                color:
                  filter === option.key
                    ? "var(--theme-elevation-0)"
                    : "var(--theme-elevation-600)",
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
        <span
          style={{
            marginLeft: "auto",
            fontSize: "0.8rem",
            color: "var(--theme-elevation-400)",
          }}
        >
          {visible.length} av {rows.length}
        </span>
      </div>

      {visible.length === 0 ? (
        <p style={{ color: "var(--theme-elevation-500)" }}>
          Ingen kontakter matcher søket.
        </p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            cellPadding={0}
            cellSpacing={0}
            style={{ width: "100%", borderCollapse: "collapse" }}
          >
            <thead>
              <tr>
                {["Kontakt", "Finnes som", "Sist aktiv"].map((heading) => (
                  <th
                    key={heading}
                    style={{
                      textAlign: "left",
                      padding: "0.5rem 0.75rem",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--theme-elevation-400)",
                      borderBottom: "1px solid var(--theme-elevation-150)",
                    }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.canonicalEmail}>
                  <td
                    style={{
                      padding: "0.6rem 0.75rem",
                      borderBottom: "1px solid var(--theme-elevation-100)",
                      verticalAlign: "top",
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>
                      {row.name || row.email}
                    </div>
                    {row.name ? (
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--theme-elevation-500)",
                        }}
                      >
                        {row.email}
                      </div>
                    ) : null}
                  </td>
                  <td
                    style={{
                      padding: "0.6rem 0.75rem",
                      borderBottom: "1px solid var(--theme-elevation-100)",
                      verticalAlign: "top",
                    }}
                  >
                    <Badges row={row} />
                  </td>
                  <td
                    style={{
                      padding: "0.6rem 0.75rem",
                      borderBottom: "1px solid var(--theme-elevation-100)",
                      verticalAlign: "top",
                      whiteSpace: "nowrap",
                      fontSize: "0.85rem",
                      color: "var(--theme-elevation-500)",
                    }}
                  >
                    {formatDate(row.lastActivity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
