"use client";

import { useDocumentInfo } from "@payloadcms/ui";
import { useEffect, useState } from "react";
import {
  type MediaUsageResult,
  getMediaUsage,
} from "../../actions/media-insights";

/**
 * «Brukt på»-panel i sidestolpen på et mediedokument. Svarer på det eneste
 * spørsmålet man egentlig har før man sletter et bilde: står det noe sted?
 *
 * Bruken utledes fra fremmednøklene i databasen (lib/media-usage.ts), så
 * blokker og felt som kommer til senere blir med av seg selv.
 */
export const MediaUsagePanel = () => {
  const { id } = useDocumentInfo();
  const [result, setResult] = useState<MediaUsageResult | null>(null);

  useEffect(() => {
    if (typeof id !== "number") {
      setResult(null);
      return;
    }
    let active = true;
    setResult(null);
    getMediaUsage(id).then((res) => {
      if (active) setResult(res);
    });
    return () => {
      active = false;
    };
  }, [id]);

  // Et ulagret bilde kan per definisjon ikke være i bruk ennå.
  if (typeof id !== "number") return null;

  return (
    <div style={{ marginBottom: "1rem" }}>
      <div
        style={{
          fontSize: "0.7rem",
          fontWeight: 600,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: "var(--theme-elevation-500)",
          marginBottom: "0.4rem",
        }}
      >
        Brukt på
      </div>

      {result === null && (
        <p
          style={{
            margin: 0,
            fontSize: "0.8rem",
            color: "var(--theme-elevation-500)",
          }}
        >
          Sjekker …
        </p>
      )}

      {result?.ok === false && (
        <p
          style={{
            margin: 0,
            fontSize: "0.8rem",
            color: "var(--theme-error-500)",
          }}
        >
          {result.error}
        </p>
      )}

      {result?.ok && result.usage.length === 0 && (
        <p
          style={{
            margin: 0,
            fontSize: "0.8rem",
            color: "var(--theme-elevation-500)",
          }}
        >
          Ikke i bruk noe sted ennå. Da er det trygt å slette.
        </p>
      )}

      {result?.ok && result.usage.length > 0 && (
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "grid",
            gap: "0.35rem",
          }}
        >
          {result.usage.map((item) => (
            <li key={item.url}>
              <a
                href={item.url}
                style={{
                  fontSize: "0.82rem",
                  color: item.isCurrent
                    ? "var(--theme-text)"
                    : "var(--theme-elevation-500)",
                  textDecoration: "underline",
                }}
              >
                {item.title}
              </a>
              <span
                style={{
                  display: "block",
                  fontSize: "0.72rem",
                  color: "var(--theme-elevation-500)",
                }}
              >
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
