"use client";

import { useAllFormFields } from "@payloadcms/ui";

/**
 * Pen visning av en skjema-innsending (form-builder-pluginens Innsendinger).
 * Pluginen lagrer svarene som en rå felt/verdi-liste (`submissionData`), som
 * er tung å lese i admin. Denne komponenten monteres som `ui`-felt øverst og
 * viser de samme svarene som en ryddig liste med lesbare etiketter — selve
 * datalagringen og e-post-hookene er urørt.
 */

/** Lesbare etiketter for feltnavnene skjemaene våre faktisk bruker. */
const FIELD_LABELS: Record<string, string> = {
  navn: "Navn",
  fulltnavn: "Fullt navn",
  name: "Navn",
  epost: "E-post",
  email: "E-post",
  dinepost: "Din e-post",
  telefon: "Telefon",
  phone: "Telefon",
  tlf: "Telefon",
  emne: "Emne",
  subject: "Emne",
  tema: "Tema",
  melding: "Melding",
  message: "Melding",
  beskjed: "Beskjed",
  bedriftsnavn: "Bedriftsnavn",
  orgnummer: "Org.nummer",
  fakturaepost: "E-post for faktura",
  omsetning: "Omsetter over 1 mill/år",
  ehffaktura: "EHF-faktura",
  fakturaoppdeling: "Fakturaoppdeling",
  fakturainfo: "Fakturainfo",
  ombedriften: "Om bedriften",
  bransje: "Bransje",
  bedriftsstorrelse: "Bedriftsstørrelse",
  malgruppetype: "Målgruppe-type",
  malgruppe: "Målgruppe",
  kilde: "Sendt fra (kilde)",
  sti: "Sendt fra (side)",
  source: "Sendt fra (kilde)",
  path: "Sendt fra (side)",
};

function prettyLabel(field: string): string {
  const known = FIELD_LABELS[field.toLowerCase()];
  if (known) return known;
  return field.charAt(0).toUpperCase() + field.slice(1);
}

interface Row {
  field: string;
  value: string;
}

export const SubmissionView = () => {
  const [fields] = useAllFormFields();

  // Form-tilstanden er flat: `submissionData.0.field` / `submissionData.0.value`.
  const rows: Row[] = [];
  const typed = fields as unknown as Record<string, { value?: unknown }>;
  for (const key of Object.keys(typed)) {
    const match = /^submissionData\.(\d+)\.field$/.exec(key);
    if (!match) continue;
    const index = Number(match[1]);
    const field = String(typed[key]?.value ?? "");
    const value = String(typed[`submissionData.${index}.value`]?.value ?? "");
    if (field) rows[index] = { field, value };
  }
  const entries = rows.filter(Boolean);

  if (!entries.length) return null;

  // Lange svar (melding, om bedriften) får full bredde nederst.
  const isLong = (r: Row) => r.value.length > 80 || r.value.includes("\n");
  const short = entries.filter((r) => !isLong(r));
  const long = entries.filter(isLong);

  return (
    <div
      style={{
        marginBottom: "1.5rem",
        padding: "1rem",
        border: "1px solid var(--theme-elevation-150)",
        borderRadius: "var(--style-radius-m, 8px)",
        background: "var(--theme-elevation-50)",
      }}
    >
      <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
        <span aria-hidden>📨</span> Dette ble sendt inn
      </div>
      <p
        style={{
          margin: "0.3rem 0 0.9rem",
          fontSize: "0.78rem",
          color: "var(--theme-elevation-500)",
        }}
      >
        E-posten til dere (og bekreftelsen til avsenderen) er allerede sendt
        automatisk. Medlemskapssøknader dukker i tillegg opp under On Poynt →
        Søknader.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "0.6rem",
        }}
      >
        {short.map((r) => (
          <div
            key={r.field}
            style={{
              border: "1px solid var(--theme-elevation-100)",
              borderRadius: "8px",
              padding: "0.55rem 0.75rem",
              background: "var(--theme-elevation-0)",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "0.68rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--theme-elevation-500)",
              }}
            >
              {prettyLabel(r.field)}
            </p>
            <p
              style={{
                margin: "0.15rem 0 0",
                fontSize: "0.85rem",
                overflowWrap: "anywhere",
              }}
            >
              {r.value || "—"}
            </p>
          </div>
        ))}
      </div>

      {long.map((r) => (
        <div
          key={r.field}
          style={{
            marginTop: "0.6rem",
            border: "1px solid var(--theme-elevation-100)",
            borderRadius: "8px",
            padding: "0.55rem 0.75rem",
            background: "var(--theme-elevation-0)",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "0.68rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--theme-elevation-500)",
            }}
          >
            {prettyLabel(r.field)}
          </p>
          <p
            style={{
              margin: "0.15rem 0 0",
              fontSize: "0.85rem",
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
            }}
          >
            {r.value || "—"}
          </p>
        </div>
      ))}
    </div>
  );
};
