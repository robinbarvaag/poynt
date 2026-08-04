"use client";

import { useFormFields } from "@payloadcms/ui";
import { useEffect, useMemo, useRef, useState } from "react";
import { simulateDarkMode } from "../email/dark-mode";

/**
 * «Forhåndsvisning»-fanen på Nyhetsbrev-dokumentet: viser e-posten nøyaktig
 * slik den sendes (samme render-løype som utsendingen), live mens partneren
 * skriver — også før dokumentet er lagret. Innholdet sendes til
 * /api/newsletter-preview som rendrer HTML-en server-side.
 */
export const NewsletterPreview = () => {
  const subject = useFormFields(
    ([fields]) => fields.subject?.value as string | undefined
  );
  const previewText = useFormFields(
    ([fields]) => fields.previewText?.value as string | undefined
  );
  const content = useFormFields(([fields]) => fields.content?.value);

  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [dark, setDark] = useState(false);
  const requestId = useRef(0);

  // Lexical-staten er et nytt objekt ved hver endring — sammenlign på innhold
  // så vi bare rendrer på nytt når noe faktisk er endret.
  const contentJson = useMemo(
    () => (content ? JSON.stringify(content) : null),
    [content]
  );

  useEffect(() => {
    if (!contentJson) {
      setHtml(null);
      setError(null);
      return;
    }
    const id = ++requestId.current;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/newsletter-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject,
            previewText,
            content: JSON.parse(contentJson),
          }),
        });
        const data = (await res.json()) as { html?: string; error?: string };
        if (id !== requestId.current) return;
        if (!res.ok || !data.html) {
          setError(data.error || "Kunne ikke lage forhåndsvisningen.");
        } else {
          setHtml(data.html);
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
  }, [subject, previewText, contentJson]);

  return (
    <div>
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
          Slik ser e-posten ut i innboksen — akkurat som den sendes.
          {loading ? " Oppdaterer …" : ""}
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "0.25rem" }}>
            {[
              { label: "Desktop", value: false },
              { label: "Mobil", value: true },
            ].map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => setMobile(option.value)}
                style={{
                  padding: "0.3rem 0.75rem",
                  borderRadius: "999px",
                  border: "1px solid var(--theme-elevation-150)",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  background:
                    mobile === option.value
                      ? "var(--theme-elevation-800)"
                      : "transparent",
                  color:
                    mobile === option.value
                      ? "var(--theme-elevation-0)"
                      : "var(--theme-elevation-600)",
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "0.25rem" }}>
            {[
              { label: "Lys", value: false },
              { label: "Mørk", value: true },
            ].map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => setDark(option.value)}
                style={{
                  padding: "0.3rem 0.75rem",
                  borderRadius: "999px",
                  border: "1px solid var(--theme-elevation-150)",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  background:
                    dark === option.value
                      ? "var(--theme-elevation-800)"
                      : "transparent",
                  color:
                    dark === option.value
                      ? "var(--theme-elevation-0)"
                      : "var(--theme-elevation-600)",
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p
        style={{
          margin: "0 0 0.75rem",
          fontSize: "0.85rem",
          color: "var(--theme-elevation-500)",
        }}
      >
        <strong style={{ color: "var(--theme-elevation-700)" }}>Emne:</strong>{" "}
        {subject || "(mangler emne)"}
        {previewText ? (
          <>
            {" · "}
            <strong style={{ color: "var(--theme-elevation-700)" }}>
              Forhåndsvisningstekst:
            </strong>{" "}
            {previewText}
          </>
        ) : null}
      </p>

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
            title="Forhåndsvisning av nyhetsbrevet"
            srcDoc={dark ? simulateDarkMode(html) : html}
            sandbox=""
            style={{
              width: mobile ? "375px" : "100%",
              maxWidth: "100%",
              height: "70vh",
              minHeight: "480px",
              border: "none",
              background: dark ? "#0b0d0d" : "#f2fafa",
            }}
          />
        </div>
      ) : !error ? (
        <p style={{ color: "var(--theme-elevation-500)", fontSize: "0.85rem" }}>
          Skriv litt innhold i «Innhold»-fanen, så dukker forhåndsvisningen opp
          her.
        </p>
      ) : null}
    </div>
  );
};
