"use client";

import { Button, useDocumentInfo, useField } from "@payloadcms/ui";
import { useEffect, useState } from "react";

/**
 * «Foreslå alt-tekst»-knapp rett under alt-tekst-feltet (montert som
 * `admin.components.afterInput` på `alt`). Fyller feltet med et AI-forslag fra
 * `/api/ai/alt-text`, som leser bildet med en vision-modell. Partneren kan
 * redigere forslaget etterpå.
 *
 * Bildet hentes på to måter:
 * - Er det valgt en fil i opplastingsfeltet (nytt dokument, eller ny fil på et
 *   eksisterende), sendes selve fila som multipart. Da trenger man ikke lagre
 *   først – noe som ellers lukker «Opprett ny»-modalet.
 * - Ellers sendes dokumentets id, og endepunktet henter den lagrede fila.
 */

/** Lengste kant vi sender. Modellen leser motiv og plakattekst fint på dette. */
const MAX_EDGE = 1400;

/**
 * Krymper bildet i nettleseren før det sendes. Uten dette blir et vanlig
 * skjermbilde eller telefonfoto fort større enn grensa for én forespørsel, og
 * svaret kommer tilbake som ren tekst («Request Entity Too Large») i stedet for
 * JSON. Klarer ikke nettleseren å dekode fila, sendes originalen som før.
 */
async function shrinkForUpload(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    // Hvitt bak gjennomsiktige png-er, ellers blir motivet svart på svart.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.8);
    });
    return blob ?? file;
  } catch {
    return file;
  }
}

export const GenerateAltButton = () => {
  const { id } = useDocumentInfo();
  const { setValue, value } = useField<string>({ path: "alt" });
  // Payloads Upload-komponent legger den valgte fila her (som File) fram til
  // dokumentet lagres. `null`/undefined når ingen ny fil er valgt.
  const { value: pendingFile } = useField<File | null | undefined>({
    path: "file",
  });
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

  const hasPendingFile =
    typeof File !== "undefined" && pendingFile instanceof File;
  const hasSavedDoc = id !== undefined && id !== null;

  const onClick = async () => {
    if (!hasPendingFile && !hasSavedDoc) {
      setError("Velg eller last opp et bilde først, så kan vi lage alt-tekst.");
      return;
    }
    if (hasPendingFile && !pendingFile.type.startsWith("image/")) {
      setError("Alt-tekst kan kun genereres for bilder.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Fila i skjemaet vinner over lagret dokument: har partneren byttet
      // bilde uten å lagre, skal forslaget beskrive det nye bildet.
      let res: Response;
      if (hasPendingFile) {
        const form = new FormData();
        const shrunk = await shrinkForUpload(pendingFile);
        form.append(
          "file",
          shrunk,
          shrunk === pendingFile ? pendingFile.name : "opplasting.jpg"
        );
        res = await fetch("/api/ai/alt-text", { method: "POST", body: form });
      } else {
        res = await fetch("/api/ai/alt-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mediaId: id }),
        });
      }
      // Ikke `res.json()` rått: går noe galt i laget foran ruta (f.eks. for
      // stor forespørsel) kommer svaret som ren tekst, og da sto brukeren
      // igjen med «Unexpected token 'R'» i stedet for en forklaring.
      const raw = await res.text();
      let data: { alt?: string; error?: string } = {};
      try {
        data = JSON.parse(raw) as { alt?: string; error?: string };
      } catch {
        // Ikke JSON – vi faller tilbake på statuskoden under.
      }
      if (!res.ok || !data.alt) {
        throw new Error(
          data.error ||
            (res.status === 413
              ? "Bildet var for stort til å sendes. Lagre bildet først, og trykk «Foreslå alt-tekst» på nytt."
              : `Kunne ikke lage et forslag (serveren svarte ${res.status}).`)
        );
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
