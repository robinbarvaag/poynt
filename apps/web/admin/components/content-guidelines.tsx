"use client";

import { useAllFormFields, useDocumentInfo } from "@payloadcms/ui";
import type { CSSProperties, ReactNode } from "react";

/**
 * «Retningslinjer»-panel i admin — visuell skrivehjelp per innholdstype, i
 * samme stil som SeoPreview. Viser strukturen innholdet bør ha, en LIVE
 * sjekkliste som leser skjema-tilstanden mens en skriver, og et
 * eksempel-kort. Config-drevet på collectionSlug (useDocumentInfo), så nye
 * innholdstyper (blogg, sider) legges til i GUIDELINES uten ny komponent.
 * Montert som `ui`-felt øverst i skjemaet. Søsteren til den regelbaserte
 * Sidesjekken og AI-kvalitetsvurderingen — men denne veileder FØR
 * en skriver, ikke etter.
 */

type Fields = Record<string, { value?: unknown }>;

interface Check {
  label: string;
  /** Leser skjema-tilstanden og sier om punktet er oppfylt. */
  test: (fields: Fields) => boolean;
}

interface GuidelineConfig {
  title: string;
  intro: string;
  /** Strukturen/buen innholdet bør følge, som nummererte kort. */
  arc: { title: string; text: string }[];
  checks: Check[];
  example?: ReactNode;
}

const has = (fields: Fields, path: string): boolean => {
  const value = fields[path]?.value;
  if (typeof value === "string") return value.trim().length > 0;
  return value !== undefined && value !== null && value !== "";
};

const arrayRows = (fields: Fields, name: string): number => {
  const pattern = new RegExp(`^${name}\\.(\\d+)\\.`);
  const seen = new Set<string>();
  for (const key of Object.keys(fields)) {
    const match = pattern.exec(key);
    if (match) seen.add(match[1]);
  }
  return seen.size;
};

/** Minst én verdi i en hasMany-relasjon (form-tilstanden er et array). */
const hasAny = (fields: Fields, path: string): boolean => {
  const value = fields[path]?.value;
  return Array.isArray(value) ? value.length > 0 : has(fields, path);
};

/**
 * Felles SEO-punkter — gjelder ALLE innholdstyper som har SEO-fanen fra
 * seoPlugin (Sider, Blogginnlegg, Kundehistorier). Spres inn sist i hver
 * types `checks`, så nye punkter havner overalt automatisk.
 */
const seoChecks: Check[] = [
  {
    label: "Meta-tittel er satt i SEO-fanen",
    test: (f) => has(f, "meta.title"),
  },
  {
    label: "Meta-beskrivelse er satt i SEO-fanen (teksten Google viser)",
    test: (f) => has(f, "meta.description"),
  },
];

/* ---------- Eksempel-kort: Hageland ---------- */

const exampleMuted: CSSProperties = {
  fontSize: "0.72rem",
  color: "var(--theme-elevation-500)",
  margin: 0,
};

function CaseStudyExample() {
  return (
    <div
      style={{
        border: "1px solid var(--theme-elevation-100)",
        borderRadius: "10px",
        overflow: "hidden",
        background: "var(--theme-elevation-0)",
        maxWidth: "480px",
      }}
    >
      <div style={{ padding: "0.85rem 1rem" }}>
        <span
          style={{
            display: "inline-block",
            fontSize: "0.65rem",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            padding: "0.15rem 0.5rem",
            borderRadius: "999px",
            background: "var(--theme-success-100, #dcfce7)",
            color: "var(--theme-success-750, #15803d)",
          }}
        >
          Hageland Edens Have
        </span>
        <p
          style={{
            fontSize: "0.95rem",
            fontWeight: 700,
            margin: "0.45rem 0 0.2rem",
          }}
        >
          Hageland Edens Have nådde målene sine med On Poynt
        </p>
        <p style={exampleMuted}>
          Tittelen sier resultatet — ikke bare «Kundecase: Hageland».
        </p>
        <div
          style={{
            display: "flex",
            gap: "1.25rem",
            margin: "0.75rem 0",
            padding: "0.6rem 0.75rem",
            borderRadius: "8px",
            background: "var(--theme-elevation-50)",
          }}
        >
          {[
            { value: "2×", label: "så mange følgere" },
            { value: "52", label: "uker med plan" },
          ].map((stat) => (
            <div key={stat.label}>
              <span
                style={{
                  display: "block",
                  fontSize: "1.15rem",
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                {stat.value}
              </span>
              <span style={exampleMuted}>{stat.label}</span>
            </div>
          ))}
          <p style={{ ...exampleMuted, alignSelf: "center" }}>
            ← tall trenger ikke være store, bare ekte
          </p>
        </div>
        <p
          style={{
            fontSize: "0.8rem",
            fontStyle: "italic",
            margin: 0,
            paddingLeft: "0.75rem",
            borderLeft: "3px solid var(--theme-success-400, #4ade80)",
          }}
        >
          «Nå gruer jeg meg ikke lenger til å poste – planen ligger klar.»
        </p>
        <p style={{ ...exampleMuted, marginTop: "0.2rem" }}>
          — sitat med navn og rolle gjør historien troverdig
        </p>
      </div>
    </div>
  );
}

/* ---------- Eksempel-kort: blogg (før/etter-tittel) ---------- */

function BlogExample() {
  return (
    <div
      style={{
        border: "1px solid var(--theme-elevation-100)",
        borderRadius: "10px",
        background: "var(--theme-elevation-0)",
        maxWidth: "480px",
        padding: "0.85rem 1rem",
        display: "grid",
        gap: "0.6rem",
      }}
    >
      <div>
        <p
          style={{
            ...exampleMuted,
            textTransform: "uppercase",
            fontWeight: 600,
            letterSpacing: "0.05em",
          }}
        >
          Før
        </p>
        <p
          style={{
            fontSize: "0.9rem",
            margin: "0.15rem 0 0",
            color: "var(--theme-elevation-500)",
            textDecoration: "line-through",
          }}
        >
          Viktigheten av SEO i 2026
        </p>
      </div>
      <div>
        <p
          style={{
            ...exampleMuted,
            textTransform: "uppercase",
            fontWeight: 600,
            letterSpacing: "0.05em",
            color: "var(--theme-success-600, #16a34a)",
          }}
        >
          Etter
        </p>
        <p
          style={{ fontSize: "0.9rem", fontWeight: 700, margin: "0.15rem 0 0" }}
        >
          Google sender deg færre besøkende – her er hva du gjør med det
        </p>
        <p style={{ ...exampleMuted, marginTop: "0.2rem" }}>
          Sier hva leseren får, i et språk de selv ville søkt med.
        </p>
      </div>
    </div>
  );
}

/* ---------- Config per innholdstype ---------- */

const GUIDELINES: Record<string, GuidelineConfig> = {
  "case-studies": {
    title: "Slik skriver du en god kundehistorie",
    intro:
      "En god kundehistorie viser at det du gjør, faktisk virker. Leseren skal kjenne seg igjen i utfordringen — og tro på resultatet.",
    arc: [
      {
        title: "Utfordringen",
        text: "Hvor sto kunden? Hva var frustrasjonen i hverdagen? Vær konkret nok til at leseren kjenner seg igjen.",
      },
      {
        title: "Hva vi gjorde",
        text: "De konkrete grepene: kanaler, verktøy, valg. Ikke «vi hjalp med synlighet» — si hva som faktisk ble gjort.",
      },
      {
        title: "Resultatet",
        text: "Hva endret seg? Helst med tall, men «fra kaos til plan» teller også. Avslutt der kunden er i dag.",
      },
    ],
    checks: [
      {
        label: "Tittelen sier resultatet, ikke bare kundenavnet",
        test: (f) => {
          const title = String(f.title?.value ?? "");
          const customer = String(f.customer?.value ?? "");
          return (
            title.trim().length > 0 &&
            (customer.trim().length === 0 || title.trim() !== customer.trim())
          );
        },
      },
      {
        label: "Kort oppsummering er fylt ut (selger historien i lister)",
        test: (f) => has(f, "excerpt"),
      },
      {
        label: "Ekte bilde av kunden er valgt",
        test: (f) => has(f, "featuredImage"),
      },
      {
        label: "Minst ett resultat i tall",
        test: (f) => arrayRows(f, "results") > 0,
      },
      {
        label: "Sitat fra kunden — med navn",
        test: (f) => has(f, "quote.text") && has(f, "quote.author"),
      },
      ...seoChecks,
    ],
    example: <CaseStudyExample />,
  },
  "blog-posts": {
    title: "Slik skriver du et godt blogginnlegg",
    intro:
      "Leseren er en travel bedriftseier som skumleser. Skriv så innlegget er lett å skumme — og lett å finne i Google.",
    arc: [
      {
        title: "Kroken",
        text: "Første setning gir leseren en grunn til å fortsette. Aldri «I denne artikkelen skal vi se på …» — start med problemet eller poenget.",
      },
      {
        title: "Kjøttet",
        text: "Korte avsnitt, mellomtitler og konkrete eksempler. Skriv for skumleseren: overskriftene alene skal fortelle historien.",
      },
      {
        title: "Landingen",
        text: "Avslutt med et konkret neste steg — hva gjør leseren nå? Lenk gjerne til en tjeneste, guide eller kundehistorie.",
      },
    ],
    checks: [
      {
        label: "Tittelen er beskrivende — noe folk faktisk søker etter",
        test: (f) => String(f.title?.value ?? "").trim().length >= 25,
      },
      {
        label: "Utdrag er fylt ut (ingress i lister + søkeresultat)",
        test: (f) => has(f, "excerpt"),
      },
      {
        label: "Hovedbilde er valgt",
        test: (f) => has(f, "featuredImage"),
      },
      {
        label: "Minst én kategori er satt",
        test: (f) => hasAny(f, "categories"),
      },
      ...seoChecks,
    ],
    example: <BlogExample />,
  },
  pages: {
    title: "Slik bygger du en side som selger",
    intro:
      "Tenk på siden som en liten fortelling: først et løfte, så bevis, til slutt én tydelig ting leseren kan gjøre. Sidesjekken under sier ifra hvis oppbyggingen bør justeres.",
    arc: [
      {
        title: "Løftet",
        text: "Hero-en svarer på fem sekunder: hva er dette, hvem er det for, hvorfor bry seg? Konkret løfte slår smart formulering.",
      },
      {
        title: "Beviset",
        text: "Vis, ikke påstå: tall, kundeomtaler, logoer, kundehistorier. Veksle mellom tekst og visuelle seksjoner så siden får rytme.",
      },
      {
        title: "Handlingen",
        text: "ETT tydelig hovedmål per side, med muntlig knappetekst («Ta en prat», ikke «Les mer»). Avslutt med en CTA-seksjon.",
      },
    ],
    checks: [
      {
        label: "Siden starter med en Hero",
        test: (f) => f["layout.0.blockType"]?.value === "hero",
      },
      {
        label: "Minst tre seksjoner (løfte → bevis → handling)",
        test: (f) => arrayRows(f, "layout") >= 3,
      },
      ...seoChecks,
    ],
  },
  services: {
    title: "Slik beskriver du en tjeneste som selger",
    intro:
      "Leseren lurer på tre ting: hva får jeg, hva koster det, og hva gjør jeg nå? Svar på alle tre — konkret og uten fagord.",
    arc: [
      {
        title: "Hva du får",
        text: "Si hva kunden sitter igjen med, ikke hva vi gjør. «En ferdig innholdsplan for tre måneder» slår «vi hjelper med innhold».",
      },
      {
        title: "Hva det koster",
        text: "Prisen skal henge sammen med beskrivelsen — det skal være tydelig hva den dekker. Ved «ta kontakt»: si hva en prat innebærer.",
      },
      {
        title: "Neste steg",
        text: "Ett tydelig neste steg med muntlig knappetekst. Svar gjerne på vanlige innvendinger i FAQ-en nederst i Innhold-fanen.",
      },
    ],
    checks: [
      {
        label: "Kort beskrivelse sier hva kunden får",
        test: (f) => has(f, "shortDescription"),
      },
      {
        label: "Detaljert beskrivelse er skrevet (selve tjenestesiden)",
        test: (f) => has(f, "content"),
      },
      {
        label: "Bilde er valgt",
        test: (f) => has(f, "image"),
      },
      {
        label: "Pris er satt (eller «ta kontakt for pris» er valgt)",
        test: (f) => f.priceType?.value === "contact" || has(f, "price"),
      },
      ...seoChecks,
    ],
  },
  guides: {
    title: "Slik skriver du en god guide",
    intro:
      "Guidene er medlemmenes oppslagsverk. En god guide tar leseren fra «hvor begynner jeg?» til et konkret resultat — i deres eget tempo.",
    arc: [
      {
        title: "Hvem og hvorfor",
        text: "Ingressen sier hvem guiden er for og hva de sitter igjen med. Da vet leseren om det er verdt tiden før de scroller.",
      },
      {
        title: "Steg for steg",
        text: "Del opp med H2-overskrifter — de blir automatisk innholdsmeny. Ett tema per seksjon, konkrete eksempler framfor teori.",
      },
      {
        title: "Neste steg",
        text: "Avslutt med hva leseren gjør nå: et verktøy å prøve, en mal å laste ned, eller neste guide i løypa.",
      },
    ],
    checks: [
      {
        label: "Ingress er fylt ut (hvem + hva de sitter igjen med)",
        test: (f) => has(f, "lede"),
      },
      {
        label: "Cover-bilde er valgt",
        test: (f) => has(f, "coverImage"),
      },
      {
        label: "Emoji-ikon er satt (identitet i lister)",
        test: (f) => has(f, "icon"),
      },
      {
        label: "Guiden har innhold (minst én blokk)",
        test: (f) => arrayRows(f, "content") > 0,
      },
      {
        label: "Relaterte guider er valgt (holder leseren i løypa)",
        test: (f) => hasAny(f, "relatedGuides"),
      },
    ],
  },
};

/* ---------- Panelet ---------- */

const sectionLabel: CSSProperties = {
  fontSize: "0.8rem",
  fontWeight: 600,
  margin: "0 0 0.5rem",
  color: "var(--theme-elevation-600)",
};

export const ContentGuidelines = () => {
  const { collectionSlug } = useDocumentInfo();
  const [fields] = useAllFormFields();
  const config = collectionSlug ? GUIDELINES[collectionSlug] : undefined;
  if (!config) return null;

  const results = config.checks.map((check) => ({
    label: check.label,
    ok: check.test(fields as unknown as Fields),
  }));
  const doneCount = results.filter((r) => r.ok).length;

  return (
    <div
      style={{
        border: "1px solid var(--theme-elevation-150)",
        borderRadius: "8px",
        padding: "1rem",
        marginBottom: "1.5rem",
        display: "grid",
        gap: "1.25rem",
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
          <p style={{ ...sectionLabel, margin: 0 }}>
            <span aria-hidden>🧩</span> {config.title}
          </p>
          <span
            style={{
              marginLeft: "auto",
              fontSize: "0.72rem",
              color:
                doneCount === results.length
                  ? "var(--theme-success-500)"
                  : "var(--theme-elevation-500)",
            }}
          >
            {doneCount}/{results.length} på plass
          </span>
        </div>
        <p
          style={{
            fontSize: "0.8rem",
            color: "var(--theme-elevation-600)",
            margin: "0.35rem 0 0",
          }}
        >
          {config.intro}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "0.6rem",
        }}
      >
        {config.arc.map((step, i) => (
          <div
            key={step.title}
            style={{
              border: "1px solid var(--theme-elevation-100)",
              borderRadius: "8px",
              padding: "0.7rem 0.85rem",
              background: "var(--theme-elevation-0)",
            }}
          >
            <p
              style={{
                fontSize: "0.7rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--theme-success-600, #16a34a)",
                margin: "0 0 0.25rem",
              }}
            >
              {i + 1}. {step.title}
            </p>
            <p
              style={{
                fontSize: "0.78rem",
                color: "var(--theme-elevation-600)",
                margin: 0,
                lineHeight: 1.45,
              }}
            >
              {step.text}
            </p>
          </div>
        ))}
      </div>

      <div>
        <p style={sectionLabel}>Sjekkliste (oppdateres mens du skriver)</p>
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "grid",
            gap: "0.3rem",
          }}
        >
          {results.map((r) => (
            <li
              key={r.label}
              style={{
                fontSize: "0.8rem",
                display: "flex",
                gap: "0.45rem",
                color: r.ok
                  ? "var(--theme-elevation-800)"
                  : "var(--theme-elevation-500)",
              }}
            >
              <span aria-hidden>{r.ok ? "✅" : "⬜"}</span> {r.label}
            </li>
          ))}
        </ul>
      </div>

      {config.example && (
        <details>
          <summary
            style={{
              cursor: "pointer",
              fontSize: "0.78rem",
              color: "var(--theme-elevation-500)",
            }}
          >
            Se et eksempel på oppskriften i praksis
          </summary>
          <div style={{ marginTop: "0.6rem" }}>{config.example}</div>
        </details>
      )}
    </div>
  );
};
