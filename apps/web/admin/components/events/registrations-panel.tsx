"use client";

import { Button, useDocumentInfo } from "@payloadcms/ui";
import { type CSSProperties, useCallback, useEffect, useState } from "react";
import {
  REGISTRATION_STATUSES,
  type RegistrationStatus,
  statusLabel,
} from "../../../lib/events/capacity";
import { formatKr } from "../../../lib/events/payment-rules";
import type {
  RegistrationOverview,
  RegistrationRow,
} from "../../../lib/events/registrations";
import {
  ANSWERS_RETENTION_DAYS,
  REGISTRATION_RETENTION_MONTHS,
  isAnonymizedEmail,
} from "../../../lib/events/retention";

/**
 * «Påmeldte»-fanen på et event: tellere, søk og filter, og handlinger per
 * person (sjekk inn, meld av, gi plass fra venteliste, send billett på nytt).
 * Leser fra /api/eventer/admin/[id] — påmeldingene ligger i en egen
 * collection, ikke på selve event-dokumentet.
 */

const STATUS_STYLE: Record<RegistrationStatus, CSSProperties> = {
  registered: {
    background: "var(--theme-success-100, #dcfce7)",
    color: "var(--theme-success-750, #15803d)",
  },
  checked_in: {
    background: "var(--theme-success-500, #22c55e)",
    color: "#fff",
  },
  waitlisted: {
    background: "var(--theme-warning-100, #fef3c7)",
    color: "var(--theme-warning-750, #b45309)",
  },
  cancelled: {
    background: "var(--theme-elevation-100)",
    color: "var(--theme-elevation-600)",
  },
  pending_payment: {
    background: "var(--theme-warning-100, #fef3c7)",
    color: "var(--theme-warning-750, #b45309)",
  },
  refunded: {
    background: "var(--theme-elevation-100)",
    color: "var(--theme-elevation-600)",
  },
};

const muted: CSSProperties = {
  color: "var(--theme-elevation-500)",
  fontSize: "0.8rem",
};

const cellStyle: CSSProperties = {
  padding: "0.55rem 0.6rem",
  borderBottom: "1px solid var(--theme-elevation-100)",
  verticalAlign: "top",
  fontSize: "0.85rem",
};

const formatDateTime = (value: string | null) =>
  value
    ? new Date(value).toLocaleString("nb-NO", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "";

type Filter = "all" | RegistrationStatus;

export function RegistrationsPanel() {
  const { id } = useDocumentInfo();
  const [data, setData] = useState<RegistrationOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/eventer/admin/${id}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) throw new Error((await res.json()).error ?? res.statusText);
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke hente lista.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!id) {
    return (
      <p style={muted}>Lagre eventet først, så dukker påmeldingene opp her.</p>
    );
  }

  const act = async (
    row: RegistrationRow,
    action:
      | "cancel"
      | "promote"
      | "check-in"
      | "undo-check-in"
      | "resend"
      | "delete"
      | "refund"
  ) => {
    let notify = false;
    if (action === "refund") {
      const amount = row.payment?.amountKr
        ? formatKr(row.payment.amountKr)
        : "beløpet";
      const guests = guestCountByHost.get(row.id) ?? 0;
      if (
        !window.confirm(
          `Refundere ${amount} til ${row.name}${guests ? ` (gjelder også ${guests} i følget)` : ""}? Pengene går tilbake via ${row.payment?.provider === "vipps" ? "Vipps" : "kortet"}, billetten slutter å virke, og plassen går videre til ventelista.`
        )
      ) {
        return;
      }
    }
    if (
      action === "delete" &&
      !window.confirm(
        `Slette ${row.name} for godt? Navn, e-post og svar fjernes og kan ikke hentes tilbake. Bruk dette når noen ber om å bli slettet.`
      )
    ) {
      return;
    }
    if (action === "cancel") {
      if (!window.confirm(`Melde av ${row.name}?`)) return;
      notify = window.confirm(
        `Skal ${row.name} få en e-post om at påmeldingen er meldt av?`
      );
    }
    setBusyId(row.id);
    setNotice(null);
    try {
      const res = await fetch(`/api/eventer/admin/pamelding/${row.id}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notify }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Noe gikk galt.");
      if (action === "resend")
        setNotice(
          row.email
            ? `Billetten er sendt til ${row.email}.`
            : "Billetten er sendt."
        );
      if (action === "delete") {
        setNotice(
          json.promoted
            ? `Påmeldingen er slettet. ${json.promoted} rykket opp fra ventelista og har fått billett.`
            : "Påmeldingen er slettet."
        );
      }
      if (action === "refund") {
        setNotice(
          `${formatKr(json.refundedKr ?? 0)} er refundert til ${row.name}.${json.promoted ? ` ${json.promoted} rykket opp fra ventelista.` : ""}`
        );
      }
      if (action === "cancel" && json.promoted) {
        setNotice(
          `${row.name} er meldt av. ${json.promoted} rykket opp fra ventelista og har fått billett.`
        );
      }
      await load();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Noe gikk galt.");
    } finally {
      setBusyId(null);
    }
  };

  const rows = (data?.rows ?? []).filter((row) => {
    if (filter !== "all" && row.status !== filter) return false;
    const q = query.trim().toLowerCase();
    return (
      !q ||
      row.name.toLowerCase().includes(q) ||
      (row.email ?? "").toLowerCase().includes(q) ||
      row.code.toLowerCase().includes(q)
    );
  });

  // Følge: vis hvem de hører til, og hvor mange hver person tok med.
  const nameById = new Map((data?.rows ?? []).map((row) => [row.id, row.name]));
  const guestCountByHost = new Map<number, number>();
  for (const row of data?.rows ?? []) {
    if (row.guestOfId && row.status !== "cancelled") {
      guestCountByHost.set(
        row.guestOfId,
        (guestCountByHost.get(row.guestOfId) ?? 0) + 1
      );
    }
  }

  const counts = data?.counts;
  const seats = counts
    ? counts.registered + counts.checked_in + counts.pending_payment
    : 0;
  const paidTotal = (data?.rows ?? []).reduce(
    (sum, row) =>
      row.payment?.paidAt && !row.payment.refundedAt
        ? sum + (row.payment.amountKr ?? 0)
        : sum,
    0
  );
  const capacity = data?.event.capacity;

  return (
    <div style={{ display: "grid", gap: "1rem", marginBottom: "2rem" }}>
      {/* Payloads `error`-stil blir ren tekst i mørkt tema — rød ramme i stedet. */}
      <style>{`
        .btn.registration-delete-btn {
          color: var(--theme-error-500);
          box-shadow: inset 0 0 0 1px var(--theme-error-500);
        }
        .btn.registration-delete-btn:hover:not(:disabled) {
          background: var(--theme-error-500);
          color: var(--theme-elevation-0);
        }
      `}</style>
      {counts && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "0.6rem",
          }}
        >
          <Stat
            label="Plasser tatt"
            value={capacity ? `${seats} / ${capacity}` : String(seats)}
          />
          <Stat label="Møtt" value={String(counts.checked_in)} />
          <Stat label="På venteliste" value={String(counts.waitlisted)} />
          <Stat label="Avmeldt" value={String(counts.cancelled)} />
          {data?.event.priceKr ? (
            <Stat label="Innbetalt" value={formatKr(paidTotal)} />
          ) : null}
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          alignItems: "center",
        }}
      >
        <input
          type="search"
          placeholder="Søk på navn, e-post eller kode"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: "1 1 220px",
            padding: "0.5rem 0.75rem",
            borderRadius: "6px",
            border: "1px solid var(--theme-elevation-150)",
            background: "var(--theme-input-bg, var(--theme-elevation-0))",
            color: "inherit",
          }}
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as Filter)}
          style={{
            padding: "0.5rem 0.75rem",
            borderRadius: "6px",
            border: "1px solid var(--theme-elevation-150)",
            background: "var(--theme-input-bg, var(--theme-elevation-0))",
            color: "inherit",
          }}
        >
          <option value="all">Alle</option>
          {REGISTRATION_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <Button
          buttonStyle="secondary"
          size="small"
          margin={false}
          onClick={load}
          disabled={loading}
        >
          {loading ? "Henter…" : "Oppdater"}
        </Button>
        <Button
          el="anchor"
          url={`/innsjekk?event=${id}`}
          buttonStyle="pill"
          size="small"
          margin={false}
        >
          Åpne innsjekk
        </Button>
        <Button
          el="anchor"
          url={`/api/eventer/admin/${id}/csv`}
          buttonStyle="pill"
          size="small"
          margin={false}
        >
          Last ned liste (CSV)
        </Button>
        <Button
          buttonStyle="pill"
          size="small"
          margin={false}
          onClick={() => setComposerOpen((open) => !open)}
        >
          Send e-post til påmeldte
        </Button>
      </div>

      {composerOpen && (
        <MessageComposer
          eventId={id}
          onDone={(text) => {
            setNotice(text);
            setComposerOpen(false);
          }}
          onCancel={() => setComposerOpen(false)}
        />
      )}

      <p style={{ ...muted, margin: 0 }}>
        Personvern: svar på ekstra spørsmål slettes automatisk{" "}
        {ANSWERS_RETENTION_DAYS} dager etter eventet, og navn og e-post{" "}
        {REGISTRATION_RETENTION_MONTHS} måneder etter (tallene beholdes). Ber
        noen om å bli slettet før det, bruk «Slett». Nedlastede CSV-filer må
        dere slette selv.
      </p>

      {notice && (
        <output
          style={{
            display: "block",
            margin: 0,
            padding: "0.6rem 0.8rem",
            borderRadius: "6px",
            background: "var(--theme-elevation-50)",
            fontSize: "0.85rem",
          }}
        >
          {notice}
        </output>
      )}
      {error && (
        <p role="alert" style={{ ...muted, color: "var(--theme-error-500)" }}>
          {error}
        </p>
      )}

      {data && data.rows.length === 0 ? (
        <p style={muted}>
          Ingen har meldt seg på ennå. Når eventet er publisert, dukker
          påmeldingene opp her.
        </p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left" }}>
                {["Navn", "Status", "Kode", "Påmeldt"].map((h) => (
                  <th key={h} style={{ ...cellStyle, ...muted }}>
                    {h}
                  </th>
                ))}
                {data?.event.questions.map((q) => (
                  <th
                    key={q.name}
                    style={{ ...cellStyle, ...muted, minWidth: "10rem" }}
                  >
                    {q.label}
                  </th>
                ))}
                <th style={{ ...cellStyle, ...muted }} />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td style={cellStyle}>
                    {isAnonymizedEmail(row.email) ? (
                      <span style={muted}>
                        Slettet (personopplysninger fjernet)
                      </span>
                    ) : (
                      <>
                        <strong>{row.name}</strong>
                        <br />
                        {row.guestOfId ? (
                          <span style={muted}>
                            Følge av{" "}
                            {nameById.get(row.guestOfId) ?? "(slettet)"}
                          </span>
                        ) : (
                          <span style={muted}>
                            {row.email ?? "Ingen e-post"}
                          </span>
                        )}
                      </>
                    )}
                    {guestCountByHost.get(row.id) ? (
                      <span style={{ ...muted, display: "block" }}>
                        Tar med {guestCountByHost.get(row.id)}
                      </span>
                    ) : null}
                    {row.source === "walk_in" && (
                      <span style={{ ...muted, display: "block" }}>
                        Registrert på stedet
                      </span>
                    )}
                    {row.newsletter && (
                      <span style={{ ...muted, display: "block" }}>
                        ✉ Nyhetsbrev
                      </span>
                    )}
                  </td>
                  <td style={cellStyle}>
                    <span
                      style={{
                        ...STATUS_STYLE[row.status],
                        display: "inline-block",
                        padding: "0.15rem 0.55rem",
                        borderRadius: "999px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {statusLabel(row.status)}
                      {row.status === "waitlisted" && row.waitlistPosition
                        ? ` #${row.waitlistPosition}`
                        : ""}
                    </span>
                    {row.payment?.amountKr ? (
                      <span style={{ ...muted, display: "block" }}>
                        {row.payment.refundedAt
                          ? `Refundert ${formatKr(row.payment.amountKr)}`
                          : row.payment.paidAt
                            ? `Betalt ${formatKr(row.payment.amountKr)} · ${row.payment.provider === "vipps" ? "Vipps" : "kort"}`
                            : row.payment.expiresAt
                              ? `${formatKr(row.payment.amountKr)}, frist ${formatDateTime(row.payment.expiresAt)}`
                              : formatKr(row.payment.amountKr)}
                      </span>
                    ) : null}
                    {row.checkedInAt && (
                      <span style={{ ...muted, display: "block" }}>
                        {formatDateTime(row.checkedInAt)}
                      </span>
                    )}
                    {row.cancelledAt && (
                      <span style={{ ...muted, display: "block" }}>
                        {formatDateTime(row.cancelledAt)}
                        {row.cancelledBy === "admin" ? " (av admin)" : ""}
                      </span>
                    )}
                  </td>
                  <td
                    style={{
                      ...cellStyle,
                      fontFamily: "monospace",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {isAnonymizedEmail(row.email) ? (
                      <span style={muted}>—</span>
                    ) : (
                      row.code
                    )}
                  </td>
                  <td style={{ ...cellStyle, whiteSpace: "nowrap" }}>
                    {formatDateTime(row.createdAt)}
                  </td>
                  {data?.event.questions.map((q) => {
                    const value = row.answers[q.name];
                    return (
                      <td
                        key={q.name}
                        style={{ ...cellStyle, minWidth: "10rem" }}
                      >
                        {typeof value === "boolean"
                          ? value
                            ? "Ja"
                            : "Nei"
                          : (value ?? "")}
                      </td>
                    );
                  })}
                  <td style={{ ...cellStyle, whiteSpace: "nowrap" }}>
                    <RowActions
                      row={row}
                      busy={busyId === row.id}
                      onAction={(action) => act(row, action)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && data && data.rows.length > 0 && (
            <p style={muted}>Ingen treff.</p>
          )}
        </div>
      )}
    </div>
  );
}

const AUDIENCES = [
  { value: "tickets", label: "Alle med plass" },
  { value: "waitlisted", label: "Alle på ventelista" },
  { value: "all", label: "Alle med plass og på ventelista" },
] as const;

type Audience = (typeof AUDIENCES)[number]["value"];

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "0.5rem 0.75rem",
  borderRadius: "6px",
  border: "1px solid var(--theme-elevation-150)",
  background: "var(--theme-input-bg, var(--theme-elevation-0))",
  color: "inherit",
  font: "inherit",
};

/** Skriv og send en beskjed på e-post til de påmeldte. */
function MessageComposer({
  eventId,
  onDone,
  onCancel,
}: {
  eventId: number | string;
  onDone: (notice: string) => void;
  onCancel: () => void;
}) {
  const [audience, setAudience] = useState<Audience>("tickets");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [count, setCount] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const post = useCallback(
    (body: Record<string, unknown>) =>
      fetch(`/api/eventer/admin/${eventId}/epost`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    [eventId]
  );

  useEffect(() => {
    let cancelled = false;
    setCount(null);
    post({ audience, preview: true })
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled)
          setCount(typeof json.count === "number" ? json.count : 0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [audience, post]);

  const send = async () => {
    if (!count || !subject.trim() || !message.trim()) return;
    if (
      !window.confirm(
        `Sende «${subject.trim()}» til ${count} ${count === 1 ? "person" : "personer"}? Det kan ikke angres.`
      )
    ) {
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await post({ audience, subject, message });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Noe gikk galt.");
      onDone(
        json.failed
          ? `Sendt til ${json.sent}, men ${json.failed} feilet. Prøv igjen senere, eller send til dem direkte.`
          : `Beskjeden er sendt til ${json.sent} ${json.sent === 1 ? "person" : "personer"}.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Noe gikk galt.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      style={{
        display: "grid",
        gap: "0.75rem",
        padding: "1rem",
        borderRadius: "8px",
        border: "1px solid var(--theme-elevation-150)",
      }}
    >
      <div>
        <strong>E-post til påmeldte</strong>
        <p style={{ ...muted, margin: "0.25rem 0 0" }}>
          For endringer, avlysning eller praktisk info. Hver person får sin egen
          e-post med lenke til billetten, og svar går til varslingsadressen.
        </p>
      </div>
      <label style={{ display: "grid", gap: "0.3rem" }}>
        <span style={muted}>Til</span>
        <select
          value={audience}
          onChange={(e) => setAudience(e.target.value as Audience)}
          style={inputStyle}
        >
          {AUDIENCES.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
        <span style={muted}>
          {count === null
            ? "Teller mottakere…"
            : count === 0
              ? "Ingen med e-post i denne gruppa."
              : `${count} ${count === 1 ? "mottaker" : "mottakere"}`}
        </span>
      </label>
      <label style={{ display: "grid", gap: "0.3rem" }}>
        <span style={muted}>Emne</span>
        <input
          value={subject}
          maxLength={150}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="F.eks. «Nytt tidspunkt: vi starter 18:30»"
          style={inputStyle}
        />
      </label>
      <label style={{ display: "grid", gap: "0.3rem" }}>
        <span style={muted}>Melding</span>
        <textarea
          value={message}
          maxLength={5000}
          rows={7}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Skriv som til en venn. Tom linje gir nytt avsnitt. «Hei navn,» og hilsen legges til automatisk."
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </label>
      {error && (
        <p role="alert" style={{ ...muted, color: "var(--theme-error-500)" }}>
          {error}
        </p>
      )}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <Button
          size="small"
          margin={false}
          onClick={send}
          disabled={sending || !count || !subject.trim() || !message.trim()}
        >
          {sending ? "Sender…" : count ? `Send til ${count}` : "Send"}
        </Button>
        <Button
          buttonStyle="secondary"
          size="small"
          margin={false}
          onClick={onCancel}
          disabled={sending}
        >
          Avbryt
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid var(--theme-elevation-100)",
        borderRadius: "8px",
        padding: "0.7rem 0.85rem",
      }}
    >
      <span
        style={{
          display: "block",
          fontSize: "1.4rem",
          fontWeight: 700,
          lineHeight: 1.1,
        }}
      >
        {value}
      </span>
      <span style={muted}>{label}</span>
    </div>
  );
}

function RowActions({
  row,
  busy,
  onAction,
}: {
  row: RegistrationRow;
  busy: boolean;
  onAction: (
    action:
      | "cancel"
      | "promote"
      | "check-in"
      | "undo-check-in"
      | "resend"
      | "delete"
      | "refund"
  ) => void;
}) {
  if (isAnonymizedEmail(row.email)) return null;
  const small = {
    buttonStyle: "secondary" as const,
    size: "small" as const,
    margin: false,
    disabled: busy,
  };
  const line: CSSProperties = { display: "flex", gap: "0.35rem" };
  // Statushandling + billett øverst; avmelding og sletting (som ikke kan
  // angres) på egen linje, med «Slett» i rødt.
  return (
    <div style={{ display: "grid", gap: "0.35rem", justifyItems: "start" }}>
      {row.status !== "cancelled" && row.status !== "refunded" && (
        <div style={line}>
          {row.status === "registered" && (
            <Button {...small} onClick={() => onAction("check-in")}>
              Sjekk inn
            </Button>
          )}
          {row.status === "waitlisted" && (
            <Button {...small} onClick={() => onAction("promote")}>
              Gi plass
            </Button>
          )}
          {row.status === "checked_in" && (
            <Button {...small} onClick={() => onAction("undo-check-in")}>
              Angre innsjekk
            </Button>
          )}
          {row.email && (
            <Button {...small} onClick={() => onAction("resend")}>
              Send billett
            </Button>
          )}
        </div>
      )}
      <div style={line}>
        {row.payment?.paidAt && !row.payment.refundedAt && (
          <Button {...small} onClick={() => onAction("refund")}>
            Refunder
          </Button>
        )}
        {row.status !== "cancelled" && row.status !== "refunded" && (
          <Button {...small} onClick={() => onAction("cancel")}>
            Meld av
          </Button>
        )}
        <Button
          {...small}
          className="registration-delete-btn"
          onClick={() => onAction("delete")}
        >
          Slett
        </Button>
      </div>
    </div>
  );
}
