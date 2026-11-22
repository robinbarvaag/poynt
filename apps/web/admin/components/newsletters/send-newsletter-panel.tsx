"use client";

import { useDocumentInfo, useField, useFormModified } from "@payloadcms/ui";
import { useState } from "react";

/**
 * Send-panel på Nyhetsbrev-dokumentet (montert som `ui`-felt i sidemenyen).
 * Tre handlinger mot /api/newsletter-broadcast:
 * - «Send test til meg»: vanlig e-post til innlogget admin
 * - «Send ekte test-broadcast til meg»: Resend Broadcast til et segment med
 *   bare admin-brukeren — avmeldingslenke, flettefelt og Resend-statistikk
 *   virker som i den ekte utsendingen
 * - «Send til alle abonnenter»: Resend Broadcast til hele lista. Kan ikke
 *   angres, så knappen åpner en bekreftelse i panelet som viser emne og
 *   antall mottakere og krever at man skriver SEND. Finnes det flere
 *   mottakerlister i Resend (f.eks. en ettersending til dem som ikke fikk
 *   forrige utsending), kan man velge en av dem der. Sperret når skjemaet har
 *   ulagrede endringer (ellers ville den lagrede, gamle versjonen gått ut).
 *   Etter utsending markeres dokumentet som sendt server-side, så vi laster
 *   siden på nytt for å vise oppdatert status.
 */
type Mode = "test" | "test-broadcast" | "send";

interface Segment {
  id: string;
  name: string;
  subscribers: number;
}

const CONFIRM_WORD = "SEND";

const hint: React.CSSProperties = {
  fontSize: "0.75rem",
  color: "var(--theme-elevation-500)",
  margin: 0,
};

export const SendNewsletterPanel = () => {
  const { id } = useDocumentInfo();
  const { value: status } = useField<string>({ path: "status" });
  const { value: subject } = useField<string>({ path: "subject" });
  const modified = useFormModified();

  const [busy, setBusy] = useState<Mode | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Bekreftelsessteget for «Send til alle».
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState("");
  const [recipients, setRecipients] = useState<number | null>(null);
  // Andre mottakerlister i Resend enn «alle abonnenter» — tom = ingen valg.
  const [segments, setSegments] = useState<Segment[]>([]);
  const [segmentId, setSegmentId] = useState("");
  const segment = segments.find((s) => s.id === segmentId);

  const isSent = status === "sent";
  const unsaved = id === undefined || id === null || modified;

  const openConfirm = async () => {
    setError(null);
    setMessage(null);
    setTyped("");
    setRecipients(null);
    setSegments([]);
    setSegmentId("");
    setConfirming(true);
    try {
      const res = await fetch("/api/newsletter-broadcast");
      const data = (await res.json()) as {
        subscribers?: number;
        segments?: Segment[];
      };
      if (res.ok && typeof data.subscribers === "number") {
        setRecipients(data.subscribers);
      }
      if (res.ok && Array.isArray(data.segments)) {
        setSegments(data.segments);
      }
    } catch {
      // Antallet er bare til orientering — bekreftelsen virker uten.
    }
  };

  const run = async (mode: Mode) => {
    if (id === undefined || id === null) {
      setError("Lagre nyhetsbrevet først.");
      return;
    }
    setBusy(mode);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/newsletter-broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          mode,
          ...(mode === "send" && segmentId && { segmentId }),
        }),
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
      } else if (mode === "test-broadcast") {
        setMessage(
          `Test-broadcast sendt til ${data.sentTo} via Resend. Den kan bruke et minutt på å komme fram. Ikke trykk på avmeldingslenken — den virker!`
        );
      } else {
        setConfirming(false);
        setMessage(
          segment
            ? `Nyhetsbrevet er sendt til «${segment.name}»! 🎉`
            : "Nyhetsbrevet er sendt til alle abonnenter! 🎉"
        );
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
      ) : confirming ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            border: "1px solid var(--theme-error-500)",
            borderRadius: "var(--style-radius-m, 6px)",
            padding: "0.75rem",
          }}
        >
          <p style={{ fontSize: "0.85rem", fontWeight: 600, margin: 0 }}>
            {segment ? "Send til denne lista?" : "Send til alle abonnenter?"}
          </p>
          {segments.length > 0 ? (
            <label style={{ ...hint, display: "block" }}>
              Send til
              <select
                value={segmentId}
                onChange={(e) => setSegmentId(e.target.value)}
                disabled={busy !== null}
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: "0.25rem",
                  padding: "0.4rem 0.5rem",
                  fontSize: "0.9rem",
                  border: "1px solid var(--theme-elevation-250)",
                  borderRadius: "var(--style-radius-s, 4px)",
                  background: "var(--theme-input-bg)",
                  color: "inherit",
                }}
              >
                <option value="">
                  Alle abonnenter
                  {recipients === null ? "" : ` (${recipients})`}
                </option>
                {segments.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.subscribers})
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <p style={{ fontSize: "0.85rem", margin: 0 }}>
            «{subject || "(uten emne)"}» sendes nå til{" "}
            <strong>
              {segment
                ? `${segment.subscribers} abonnenter i «${segment.name}»`
                : `${recipients === null ? "alle" : recipients} abonnenter`}
            </strong>
            . Dette kan ikke angres.
          </p>
          <label style={{ ...hint, display: "block" }}>
            Skriv {CONFIRM_WORD} for å bekrefte
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              style={{
                display: "block",
                width: "100%",
                marginTop: "0.25rem",
                padding: "0.4rem 0.5rem",
                fontSize: "0.9rem",
                border: "1px solid var(--theme-elevation-250)",
                borderRadius: "var(--style-radius-s, 4px)",
                background: "var(--theme-input-bg)",
                color: "inherit",
              }}
            />
          </label>
          <button
            type="button"
            onClick={() => run("send")}
            disabled={busy !== null || typed.trim() !== CONFIRM_WORD}
            className="btn btn--style-primary btn--size-small"
            style={{ margin: 0 }}
          >
            {busy === "send" ? "Sender …" : "Ja, send nå"}
          </button>
          {busy === "send" ? (
            <p style={hint}>
              Gjør klar mottakerlista og sender. Det kan ta et minutt — ikke
              lukk siden.
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={busy !== null}
            className="btn btn--style-secondary btn--size-small"
            style={{ margin: 0 }}
          >
            Avbryt
          </button>
        </div>
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
            onClick={() => run("test-broadcast")}
            disabled={busy !== null}
            className="btn btn--style-secondary btn--size-small"
            style={{ margin: 0 }}
            title="Sendes som en ekte broadcast fra Resend, men bare til deg. Avmeldingslenken og flettefelt virker."
          >
            {busy === "test-broadcast"
              ? "Sender test-broadcast …"
              : "Send ekte test-broadcast til meg"}
          </button>
          <button
            type="button"
            onClick={openConfirm}
            disabled={busy !== null || unsaved}
            className="btn btn--style-primary btn--size-small"
            style={{ margin: 0 }}
            title={
              unsaved
                ? "Lagre nyhetsbrevet før du sender til alle"
                : "Åpner en bekreftelse — sendes ikke før du har bekreftet"
            }
          >
            Send til alle abonnenter …
          </button>
          <p style={hint}>
            {unsaved
              ? "Lagre endringene før du kan sende til alle."
              : "Du får en bekreftelse før noe sendes."}
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
