"use client";

import { useAllFormFields } from "@payloadcms/ui";

/**
 * «Komposisjonssjekk» — regelbasert vakt for sideoppbygging, montert som
 * `ui`-felt over Sidelayout på Sider og Forside. Leser blokk-lista live fra
 * skjema-tilstanden og varsler når siden bryter retningslinjene i
 * docs/COMPOSITION.md (for mange fargepaneler, to paneler inntil hverandre,
 * dobbel hero, samme CTA flere ganger, osv.). KUN veiledning — blokkerer
 * aldri lagring. Søsteren til AI-kvalitetsvurderingen på Guider, men uten AI:
 * reglene er deterministiske og kjører i nettleseren mens en redigerer.
 */

interface BlockInfo {
  index: number;
  blockType: string;
  /** Teller blokka som mettet fargepanel i panel-rasjoneringen? */
  isPanel: boolean;
  primaryCtaUrl?: string;
}

interface Finding {
  level: "advarsel" | "tips";
  text: string;
}

const BLOCK_LABELS: Record<string, string> = {
  hero: "Hero",
  ctaSection: "CTA-seksjon",
  statsBand: "Tall-bånd",
  newsletter: "Nyhetsbrev",
  featureGrid: "Innholdskort",
  pathCards: "Veivalg-kort",
  testimonials: "Anmeldelser",
  productArchive: "Produkter",
  podcastArchive: "Podkast",
  servicesArchive: "Tjenester",
  logoCloud: "Logo-stripe",
};

function label(blockType: string): string {
  return BLOCK_LABELS[blockType] ?? blockType;
}

// Form-tilstanden er flat: `layout.0.blockType`, `layout.0.variant`, … Vi
// skanner nøklene i stedet for å anta noe om rows-strukturen.
function readBlocks(fields: Record<string, { value?: unknown }>): BlockInfo[] {
  const blocks: BlockInfo[] = [];
  for (const key of Object.keys(fields)) {
    const match = /^layout\.(\d+)\.blockType$/.exec(key);
    if (!match) continue;
    const index = Number(match[1]);
    const blockType = String(fields[key]?.value ?? "");
    if (!blockType) continue;

    const get = (sub: string) => fields[`layout.${index}.${sub}`]?.value;

    let isPanel = false;
    if (blockType === "newsletter") {
      isPanel = true;
    } else if (blockType === "ctaSection") {
      const variant = get("variant");
      isPanel = variant === "colored" || variant === "image";
    } else if (blockType === "statsBand") {
      isPanel = get("layout") !== "split";
    }

    const primaryCtaUrl =
      typeof get("primaryCta.url") === "string"
        ? (get("primaryCta.url") as string)
        : undefined;

    blocks.push({ index, blockType, isPanel, primaryCtaUrl });
  }
  return blocks.sort((a, b) => a.index - b.index);
}

function analyse(blocks: BlockInfo[]): Finding[] {
  const findings: Finding[] = [];
  if (!blocks.length) return findings;

  // 1. Maks to mettede fargepaneler per side.
  const panels = blocks.filter((b) => b.isPanel);
  if (panels.length > 2) {
    findings.push({
      level: "advarsel",
      text: `Siden har ${panels.length} fargepaneler (${panels
        .map((p) => label(p.blockType))
        .join(
          ", "
        )}). Maks to per side — gjør et Tall-bånd om til «Delt»-utseende, eller bruk CTA-varianten «Enkel».`,
    });
  }

  // 2. Aldri to fargepaneler rett etter hverandre.
  for (let i = 1; i < blocks.length; i++) {
    if (blocks[i].isPanel && blocks[i - 1].isPanel) {
      findings.push({
        level: "advarsel",
        text: `${label(blocks[i - 1].blockType)} og ${label(
          blocks[i].blockType
        )} er begge fargepaneler og ligger rett etter hverandre — legg en rolig seksjon mellom, eller endre den ene.`,
      });
    }
  }

  // 3. Hero: én, og alltid først.
  const heroes = blocks.filter((b) => b.blockType === "hero");
  if (heroes.length > 1) {
    findings.push({
      level: "advarsel",
      text: "Siden har flere Hero-blokker — behold én, øverst.",
    });
  } else if (heroes.length === 1 && blocks[0].blockType !== "hero") {
    findings.push({
      level: "tips",
      text: "Hero-blokka ligger ikke øverst — den er laget for å være sidens første seksjon.",
    });
  }

  // 4. Nyhetsbrev: maks ett, og sist.
  const newsletters = blocks.filter((b) => b.blockType === "newsletter");
  if (newsletters.length > 1) {
    findings.push({
      level: "advarsel",
      text: "Siden har flere Nyhetsbrev-blokker — behold én.",
    });
  } else if (
    newsletters.length === 1 &&
    blocks[blocks.length - 1].blockType !== "newsletter"
  ) {
    findings.push({
      level: "tips",
      text: "Nyhetsbrev fungerer best som sidens siste seksjon.",
    });
  }

  // 5. Samme CTA-mål flere ganger (hero + CTA-seksjoner).
  const urls = new Map<string, number>();
  for (const b of blocks) {
    if (b.primaryCtaUrl) {
      urls.set(b.primaryCtaUrl, (urls.get(b.primaryCtaUrl) ?? 0) + 1);
    }
  }
  for (const [url, count] of urls) {
    if (count > 1) {
      findings.push({
        level: "tips",
        text: `${count} blokker har hovedknapp mot «${url}». Ett tydelig CTA-mål per side selger bedre enn mange like — la de andre seksjonene omtale det uten egen knapp.`,
      });
    }
  }

  // 6. Veldig mange blokker → siden mister retning.
  if (blocks.length > 12) {
    findings.push({
      level: "tips",
      text: `Siden har ${blocks.length} blokker — vurder å slå sammen eller flytte innhold til undersider.`,
    });
  }

  return findings;
}

const GUIDELINES: string[] = [
  "Alt innhold deler ÉN bredde og én venstrekant — blokkene ordner dette selv, ikke prøv å «brede ut» enkeltseksjoner.",
  "Seksjonstitler er venstrestilte. Sentrering er unntaket: hero og avsluttende CTA.",
  "Maks to mettede fargepaneler per side (grønt/gult/rosa panel: Tall-bånd «Bånd», CTA «Farget», Nyhetsbrev) — og aldri to inntil hverandre.",
  "Ett tydelig CTA-mål per side. Andre seksjoner kan omtale tilbudet uten egen knapp.",
  "Hero øverst, Nyhetsbrev nederst. Avstanden mellom seksjoner er fast — ikke noe du styrer per blokk.",
];

export const CompositionCheck = () => {
  const [fields] = useAllFormFields();
  const blocks = readBlocks(
    fields as unknown as Record<string, { value?: unknown }>
  );
  const findings = analyse(blocks);
  const warnings = findings.filter((f) => f.level === "advarsel");
  const tips = findings.filter((f) => f.level === "tips");

  return (
    <div
      style={{
        marginBottom: "1.5rem",
        padding: "0.9rem 1rem",
        border: "1px solid var(--theme-elevation-150)",
        borderRadius: "var(--style-radius-m, 8px)",
        background: "var(--theme-elevation-50)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          fontWeight: 600,
          fontSize: "0.9rem",
        }}
      >
        <span aria-hidden>📐</span> Komposisjonssjekk
        {blocks.length > 0 && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: "0.78rem",
              fontWeight: 500,
              color:
                warnings.length > 0
                  ? "var(--theme-warning-600, #b45309)"
                  : "var(--theme-success-500, #22c55e)",
            }}
          >
            {warnings.length > 0
              ? `${warnings.length} å se på`
              : "Følger retningslinjene"}
          </span>
        )}
      </div>

      {findings.length > 0 && (
        <ul
          style={{
            margin: "0.6rem 0 0",
            paddingLeft: "1.1rem",
            display: "grid",
            gap: "0.35rem",
          }}
        >
          {[...warnings, ...tips].map((f) => (
            <li key={f.text} style={{ fontSize: "0.82rem" }}>
              <span aria-hidden>{f.level === "advarsel" ? "⚠️" : "💡"}</span>{" "}
              {f.text}
            </li>
          ))}
        </ul>
      )}

      <details style={{ marginTop: "0.6rem" }}>
        <summary
          style={{
            cursor: "pointer",
            fontSize: "0.78rem",
            color: "var(--theme-elevation-500)",
          }}
        >
          Retningslinjer for sideoppbygging
        </summary>
        <ul
          style={{
            margin: "0.5rem 0 0",
            paddingLeft: "1.1rem",
            display: "grid",
            gap: "0.3rem",
          }}
        >
          {GUIDELINES.map((g) => (
            <li
              key={g}
              style={{
                fontSize: "0.78rem",
                color: "var(--theme-elevation-600)",
              }}
            >
              {g}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
};
