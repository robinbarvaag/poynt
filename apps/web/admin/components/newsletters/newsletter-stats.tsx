import { getNewsletterStats } from "@/lib/newsletter-stats";
import type { Payload } from "payload";

/**
 * Statistikk over Nyhetsbrev-lista (beforeListTable, server-komponent):
 * abonnenttall fra Resend, påmeldinger per kilde fra samtykkeloggen, og
 * hvor mange nyhetsbrev som er sendt. Hver kilde lenker til samtykkeloggen
 * ferdig filtrert, så partneren kan se hvem som meldte seg på hvor.
 */

const CONSENTS_LIST = "/admin/collections/newsletter-consents";

function formatDate(iso?: string): string {
  if (!iso) return "–";
  return new Date(iso).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const cardStyle: React.CSSProperties = {
  border: "1px solid var(--theme-elevation-150)",
  borderRadius: "var(--style-radius-m, 6px)",
  background: "var(--theme-elevation-0)",
  padding: "0.9rem 1.1rem",
  minWidth: 0,
};

const labelStyle: React.CSSProperties = {
  fontSize: "0.72rem",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "var(--theme-elevation-500)",
  margin: 0,
};

const numberStyle: React.CSSProperties = {
  fontSize: "1.6rem",
  fontWeight: 600,
  lineHeight: 1.2,
  margin: "0.2rem 0 0",
};

const hintStyle: React.CSSProperties = {
  fontSize: "0.78rem",
  color: "var(--theme-elevation-500)",
  margin: "0.2rem 0 0",
};

const cellStyle: React.CSSProperties = {
  padding: "0.45rem 0.6rem",
  borderBottom: "1px solid var(--theme-elevation-100)",
  fontSize: "0.85rem",
  verticalAlign: "middle",
};

const numCellStyle: React.CSSProperties = {
  ...cellStyle,
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
};

const Card = ({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: number | string;
  hint?: string;
  href?: string;
}) => (
  <div style={cardStyle}>
    <p style={labelStyle}>{label}</p>
    <p style={numberStyle}>{value}</p>
    {hint && (
      <p style={hintStyle}>
        {href ? (
          <a href={href} style={{ color: "inherit" }}>
            {hint}
          </a>
        ) : (
          hint
        )}
      </p>
    )}
  </div>
);

export const NewsletterStats = async ({ payload }: { payload: Payload }) => {
  const stats = await getNewsletterStats(payload);
  const { audience, sources, consents, newsletters } = stats;
  const maxSource = Math.max(1, ...sources.map((s) => s.total));

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "0.75rem",
          marginBottom: "1rem",
        }}
      >
        {audience ? (
          <>
            <Card
              label="Abonnenter"
              value={audience.subscribed}
              hint="Aktive i Resend"
            />
            <Card
              label="Avmeldt"
              value={audience.unsubscribed}
              hint={`${audience.total} kontakter totalt`}
            />
            <Card
              label="Nye siste 7 dager"
              value={audience.newLast7Days}
              hint={`${audience.newLast30Days} siste 30 dager`}
            />
          </>
        ) : (
          <Card
            label="Abonnenter"
            value="–"
            hint="Fikk ikke kontakt med Resend akkurat nå"
          />
        )}
        <Card
          label="Påmeldinger siste 30 dager"
          value={consents.last30Days}
          hint={
            consents.total === consents.people
              ? `${consents.total} totalt`
              : `${consents.total} totalt, fra ${consents.people} personer`
          }
        />
        <Card
          label="Nyhetsbrev sendt"
          value={newsletters.sent}
          hint={
            newsletters.lastSentAt
              ? `Sist ${formatDate(newsletters.lastSentAt)}`
              : "Ingen sendt ennå"
          }
        />
      </div>

      <details
        style={{
          border: "1px solid var(--theme-elevation-150)",
          borderRadius: "var(--style-radius-m, 6px)",
          background: "var(--theme-elevation-0)",
          padding: "0.6rem 1.1rem",
        }}
      >
        <summary
          style={{
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <span>Hvor meldte folk seg på?</span>
          <a
            href={CONSENTS_LIST}
            className="btn btn--style-secondary btn--size-small"
            style={{ margin: 0 }}
            title="Alle påmeldinger: hvem, når, hvor og hvilken tekst de sa ja til"
          >
            Åpne samtykkeloggen
          </a>
        </summary>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "0.6rem",
          }}
        >
          <thead>
            <tr>
              <th style={{ ...cellStyle, textAlign: "left" }}>Kilde</th>
              <th style={numCellStyle}>Totalt</th>
              <th style={numCellStyle}>Siste 30 dager</th>
              <th style={{ ...cellStyle, width: "35%" }} aria-hidden />
            </tr>
          </thead>
          <tbody>
            {sources.map((s) => (
              <tr key={s.source}>
                <td style={cellStyle}>
                  <a
                    href={`${CONSENTS_LIST}?where[source][equals]=${encodeURIComponent(s.source)}`}
                    style={{ color: "inherit" }}
                    title="Vis påmeldingene fra denne kilden"
                  >
                    {s.label}
                  </a>
                </td>
                <td style={numCellStyle}>{s.total}</td>
                <td style={numCellStyle}>{s.last30Days}</td>
                <td style={cellStyle}>
                  <div
                    style={{
                      height: "0.5rem",
                      borderRadius: "999px",
                      background: "var(--theme-elevation-100)",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.round((s.total / maxSource) * 100)}%`,
                        borderRadius: "999px",
                        background: "var(--theme-success-500, #22c55e)",
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ ...hintStyle, margin: "0.6rem 0 0.3rem" }}>
          Tallene er fra samtykkeloggen: én rad per påmelding, så en person som
          først brukte QR-koden i boka og så meldte seg på et event, telles to
          ganger her, men er én abonnent i Resend. Avmeldinger, åpninger og
          klikk ser du i Resend.
          {consents.failed > 0 && (
            <>
              {" "}
              <a
                href={`${CONSENTS_LIST}?where[subscribed][equals]=false`}
                style={{ color: "var(--theme-error-500)" }}
              >
                {consents.failed} påmelding
                {consents.failed === 1 ? "" : "er"} kom ikke inn i Resend
              </a>
              .
            </>
          )}
        </p>
      </details>
    </div>
  );
};
