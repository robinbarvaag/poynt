"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { simulateDarkMode } from "./dark-mode";

/**
 * Delt live-forhåndsvisning av en e-post i admin: debounced henting fra
 * /api/email-preview + iframe med desktop/mobil- og lys/mørk-brytere.
 * Brukes av forhåndsvisningene på E-postmaler, Skjemaer og Kasse og kvittering.
 */

export function useEmailPreview(request: Record<string, unknown> | null) {
  const [html, setHtml] = useState<string | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);

  // Form-state gir nye objektreferanser ved hver endring — sammenlign på
  // innhold så vi bare henter på nytt når noe faktisk er endret.
  const requestJson = useMemo(
    () => (request ? JSON.stringify(request) : null),
    [request]
  );

  useEffect(() => {
    if (!requestJson) {
      setHtml(null);
      setError(null);
      return;
    }
    const id = ++requestId.current;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/email-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: requestJson,
        });
        const data = (await res.json()) as {
          html?: string;
          subject?: string;
          error?: string;
        };
        if (id !== requestId.current) return;
        if (!res.ok || !data.html) {
          setError(data.error || "Kunne ikke lage forhåndsvisningen.");
        } else {
          setHtml(data.html);
          setSubject(data.subject ?? null);
          setError(null);
        }
      } catch {
        if (id === requestId.current) {
          setError("Kunne ikke lage forhåndsvisningen.");
        }
      } finally {
        if (id === requestId.current) {
          setLoading(false);
        }
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [requestJson]);

  return { html, subject, error, loading };
}

function TogglePills({
  value,
  onChange,
  options,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  options: { label: string; value: boolean }[];
}) {
  return (
    <div style={{ display: "flex", gap: "0.25rem" }}>
      {options.map((option) => (
        <button
          key={option.label}
          type="button"
          onClick={() => onChange(option.value)}
          style={{
            padding: "0.3rem 0.75rem",
            borderRadius: "999px",
            border: "1px solid var(--theme-elevation-150)",
            cursor: "pointer",
            fontSize: "0.8rem",
            background:
              value === option.value
                ? "var(--theme-elevation-800)"
                : "transparent",
            color:
              value === option.value
                ? "var(--theme-elevation-0)"
                : "var(--theme-elevation-600)",
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function PreviewFrame({
  html,
  subject,
  loading,
  error,
  emptyText,
  title = "Forhåndsvisning",
}: {
  html: string | null;
  subject?: string | null;
  loading?: boolean;
  error?: string | null;
  emptyText?: string;
  title?: string;
}) {
  const [mobile, setMobile] = useState(false);
  const [dark, setDark] = useState(false);

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: "1rem",
          flexWrap: "wrap",
          marginBottom: "0.75rem",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "0.85rem",
            color: "var(--theme-elevation-500)",
          }}
        >
          Slik ser e-posten ut i innboksen — oppdateres mens du skriver.
          {loading ? " Oppdaterer …" : ""}
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <TogglePills
            value={mobile}
            onChange={setMobile}
            options={[
              { label: "Desktop", value: false },
              { label: "Mobil", value: true },
            ]}
          />
          <TogglePills
            value={dark}
            onChange={setDark}
            options={[
              { label: "Lys", value: false },
              { label: "Mørk", value: true },
            ]}
          />
        </div>
      </div>

      {subject ? (
        <p
          style={{
            margin: "0 0 0.75rem",
            fontSize: "0.85rem",
            color: "var(--theme-elevation-500)",
          }}
        >
          <strong style={{ color: "var(--theme-elevation-700)" }}>Emne:</strong>{" "}
          {subject}
        </p>
      ) : null}

      {dark ? (
        <p
          style={{
            margin: "0 0 0.75rem",
            fontSize: "0.8rem",
            color: "var(--theme-elevation-500)",
          }}
        >
          Omtrent slik ser e-posten ut i klienter som tvinger mørk modus (f.eks.
          Gmail og Outlook) — de gjør det litt ulikt, så dette er en tilnærming.
          Apple Mail viser e-posten lys, slik den er designet.
        </p>
      ) : null}

      {error ? (
        <p style={{ color: "var(--theme-error-500)", fontSize: "0.85rem" }}>
          {error}
        </p>
      ) : null}

      {html ? (
        <div
          style={{
            border: "1px solid var(--theme-elevation-150)",
            borderRadius: "10px",
            overflow: "hidden",
            background: dark ? "#0b0d0d" : "#f2fafa",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <iframe
            title={title}
            srcDoc={dark ? simulateDarkMode(html) : html}
            sandbox=""
            style={{
              width: mobile ? "375px" : "100%",
              maxWidth: "100%",
              height: "65vh",
              minHeight: "440px",
              border: "none",
              background: dark ? "#0b0d0d" : "#f2fafa",
            }}
          />
        </div>
      ) : !error && emptyText ? (
        <p style={{ color: "var(--theme-elevation-500)", fontSize: "0.85rem" }}>
          {emptyText}
        </p>
      ) : null}
    </div>
  );
}
