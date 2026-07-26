"use client";

import type { ReactNode } from "react";

/**
 * Delt skall for de regelbaserte sjekk-panelene i admin (Sidesjekk,
 * Innleggssjekk, Historiesjekk, …): overskrift med status-badge, funn-liste
 * med advarsel/tips-nivåer og en sammenleggbar huskeregel-liste. Panelene
 * eier selv analysen — dette er kun presentasjon, og blokkerer aldri lagring.
 */

export interface Finding {
  level: "advarsel" | "tips";
  text: string;
}

interface CheckPanelProps {
  title: string;
  /** Kort forklaring under tittelen på hva panelet ser etter. */
  intro: ReactNode;
  findings: Finding[];
  /** Vis «Alt ser bra ut»/«N å se på»-badgen — skjul til det finnes innhold. */
  showStatus: boolean;
  guidelinesLabel: string;
  guidelines: string[];
}

export const CheckPanel = ({
  title,
  intro,
  findings,
  showStatus,
  guidelinesLabel,
  guidelines,
}: CheckPanelProps) => {
  const warnings = findings.filter((f) => f.level === "advarsel");
  const tips = findings.filter((f) => f.level === "tips");

  return (
    <div
      style={{
        marginBottom: "1.5rem",
        padding: "0.9rem 1rem",
        border: "1px solid var(--theme-elevation-150)",
        borderRadius: "var(--style-radius-m, 8px)",
        background: "var(--theme-elevation-50)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontWeight: 600,
          fontSize: "0.9rem",
        }}
      >
        <span aria-hidden>📐</span> {title}
        {showStatus && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: "0.78rem",
              fontWeight: 500,
              color:
                warnings.length > 0
                  ? "var(--theme-warning-600, #b45309)"
                  : "var(--theme-success-500, #22c55e)",
            }}
          >
            {warnings.length > 0
              ? `${warnings.length} å se på`
              : "Alt ser bra ut"}
          </span>
        )}
      </div>

      <p
        style={{
          margin: "0.3rem 0 0",
          fontSize: "0.78rem",
          color: "var(--theme-elevation-500)",
        }}
      >
        {intro}
      </p>

      {findings.length > 0 && (
        <ul
          style={{
            margin: "0.6rem 0 0",
            paddingLeft: "1.1rem",
            display: "grid",
            gap: "0.35rem",
          }}
        >
          {[...warnings, ...tips].map((f) => (
            <li key={f.text} style={{ fontSize: "0.82rem" }}>
              <span aria-hidden>{f.level === "advarsel" ? "⚠️" : "💡"}</span>{" "}
              {f.text}
            </li>
          ))}
        </ul>
      )}

      <details style={{ marginTop: "0.6rem" }}>
        <summary
          style={{
            cursor: "pointer",
            fontSize: "0.78rem",
            color: "var(--theme-elevation-500)",
          }}
        >
          {guidelinesLabel}
        </summary>
        <ul
          style={{
            margin: "0.5rem 0 0",
            paddingLeft: "1.1rem",
            display: "grid",
            gap: "0.3rem",
          }}
        >
          {guidelines.map((g) => (
            <li
              key={g}
              style={{
                fontSize: "0.78rem",
                color: "var(--theme-elevation-600)",
              }}
            >
              {g}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
};
