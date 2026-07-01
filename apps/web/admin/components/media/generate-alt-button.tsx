"use client";

import { useDocumentInfo, useField } from "@payloadcms/ui";
import { useState } from "react";

/**
 * «Generer alt-tekst»-knapp rett under alt-tekst-feltet (montert som
 * `admin.components.afterInput` på `alt`). Sender Media-dokumentets id til
 * `/api/ai/alt-text`, som leser bildet med en vision-modell og returnerer en
 * forslags-alt-tekst, og fyller den inn i feltet. Partneren kan redigere
 * forslaget etterpå.
 */
export const GenerateAltButton = () => {
  const { id } = useDocumentInfo();
  const { setValue } = useField<string>({ path: "alt" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        throw new Error(data.error || "Kunne ikke generere alt-tekst.");
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
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="btn btn--style-secondary btn--size-small"
        style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
      >
        <span aria-hidden>✨</span>{" "}
        {loading ? "Genererer …" : "Generer alt-tekst"}
      </button>
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
