"use client";

import { Button, useDocumentInfo, useField } from "@payloadcms/ui";
import { useEffect, useState } from "react";

/**
 * «Foreslå alt-tekst»-knapp rett under alt-tekst-feltet (montert som
 * `admin.components.afterInput` på `alt`). Sender Media-dokumentets id til
 * `/api/ai/alt-text`, som leser bildet med en vision-modell og returnerer en
 * forslags-alt-tekst, og fyller den inn i feltet. Partneren kan redigere
 * forslaget etterpå.
 */
export const GenerateAltButton = () => {
  const { id } = useDocumentInfo();
  const { setValue, value } = useField<string>({ path: "alt" });
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Sekundteller mens genereringen kjører — viser at det fortsatt skjer noe.
  useEffect(() => {
    if (!loading) return;
    setElapsed(0);
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [loading]);

  const onClick = async () => {
    if (id === undefined || id === null) {
      setError("Lagre bildet først, så kan vi lese det for å lage alt-tekst.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/alt-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId: id }),
      });
      const data = (await res.json()) as { alt?: string; error?: string };
      if (!res.ok || !data.alt) {
        throw new Error(data.error || "Kunne ikke lage et forslag.");
      }
      setValue(data.alt);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Noe gikk galt.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "0.5rem" }}>
      <style>{`
        .alt-shimmer {
          background: linear-gradient(
            90deg,
            var(--theme-elevation-100) 25%,
            var(--theme-elevation-150) 50%,
            var(--theme-elevation-100) 75%
          );
          background-size: 200% 100%;
          animation: alt-shimmer 1.4s ease-in-out infinite;
          border-radius: 4px;
          height: 12px;
        }
        @keyframes alt-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .alt-shimmer { animation: none; }
        }
      `}</style>

      <Button
        buttonStyle="pill"
        size="small"
        onClick={onClick}
        disabled={loading}
        margin={false}
      >
        {loading
          ? "Ser på bildet …"
          : value
            ? "Foreslå ny alt-tekst"
            : "Foreslå alt-tekst"}
      </Button>

      {!loading && (
        <p
          style={{
            margin: "0.4rem 0 0",
            fontSize: "0.78rem",
            color: "var(--theme-elevation-500)",
          }}
        >
          AI-en ser på bildet og skriver et forslag rett inn i feltet over. Tar
          vanligvis 5–15 sekunder, og du kan endre teksten etterpå.
        </p>
      )}

      {loading && (
        <div
          style={{ marginTop: "0.6rem", display: "grid", gap: "0.5rem" }}
          aria-live="polite"
        >
          <p
            style={{
              margin: 0,
              fontSize: "0.78rem",
              color: "var(--theme-elevation-600)",
            }}
          >
            Ser på bildet og skriver et forslag … Tar vanligvis 5–15 sekunder (
            {elapsed} s). Forslaget dukker opp i feltet over.
          </p>
          <div className="alt-shimmer" style={{ width: "85%" }} />
          <div className="alt-shimmer" style={{ width: "60%" }} />
        </div>
      )}

      {error && (
        <p
          style={{
            color: "var(--theme-error-500)",
            fontSize: "0.8rem",
            marginTop: "0.35rem",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
};
