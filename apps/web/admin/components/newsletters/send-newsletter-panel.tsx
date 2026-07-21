"use client";

import { useDocumentInfo, useField } from "@payloadcms/ui";
import { useState } from "react";

/**
 * Send-panel på Nyhetsbrev-dokumentet (montert som `ui`-felt i sidemenyen).
 * To handlinger mot /api/newsletter-broadcast:
 * - «Send test til meg»: vanlig e-post til innlogget admin
 * - «Send til alle abonnenter»: Resend Broadcast til hele audiencen (med
 *   bekreftelse). Etter utsending markeres dokumentet som sendt server-side,
 *   så vi laster siden på nytt for å vise oppdatert status.
 */
export const SendNewsletterPanel = () => {
  const { id } = useDocumentInfo();
  const { value: status } = useField<string>({ path: "status" });

  const [busy, setBusy] = useState<"test" | "send" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSent = status === "sent";

  const run = async (mode: "test" | "send") => {
    if (id === undefined || id === null) {
      setError("Lagre nyhetsbrevet først.");
      return;
    }
    if (
      mode === "send" &&
      !window.confirm(
        "Send nyhetsbrevet til ALLE abonnenter nå? Dette kan ikke angres."
      )
    ) {
      return;
    }
    setBusy(mode);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/newsletter-broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, mode }),
      });
      const data = (await res.json()) as {
        error?: string;
        sentTo?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || "Noe gikk galt.");
      }
      if (mode === "test") {
        setMessage(`Test sendt til ${data.sentTo}. Sjekk innboksen din.`);
      } else {
        setMessage("Nyhetsbrevet er sendt til alle abonnenter! 🎉");
        // Status/sentAt er oppdatert server-side — hent dokumentet på nytt.
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Noe gikk galt.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <p
        style={{
          fontSize: "0.78rem",
          fontWeight: 600,
          margin: "0 0 0.5rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "var(--theme-elevation-500)",
        }}
      >
        Utsending
      </p>

      {isSent ? (
        <p style={{ fontSize: "0.85rem", margin: 0 }}>
          ✅ Dette nyhetsbrevet er sendt. Lag et nytt for neste utsending.
        </p>
      ) : (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <button
            type="button"
            onClick={() => run("test")}
            disabled={busy !== null}
            className="btn btn--style-secondary btn--size-small"
            style={{ margin: 0 }}
          >
            {busy === "test" ? "Sender test …" : "Send test til meg"}
          </button>
          <button
            type="button"
            onClick={() => run("send")}
            disabled={busy !== null}
            className="btn btn--style-primary btn--size-small"
            style={{ margin: 0 }}
          >
            {busy === "send" ? "Sender …" : "Send til alle abonnenter"}
          </button>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--theme-elevation-500)",
              margin: 0,
            }}
          >
            Husk å lagre endringer før du sender.
          </p>
        </div>
      )}

      {message && (
        <p
          style={{
            color: "var(--theme-success-500, #22c55e)",
            fontSize: "0.8rem",
            marginTop: "0.5rem",
          }}
        >
          {message}
        </p>
      )}
      {error && (
        <p
          style={{
            color: "var(--theme-error-500)",
            fontSize: "0.8rem",
            marginTop: "0.5rem",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
};
