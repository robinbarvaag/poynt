"use client";

import { useAllFormFields } from "@payloadcms/ui";
import { CheckPanel, type Finding } from "./check-panel";

/**
 * «Sidesjekk» — regelbasert vakt for sideoppbygging, montert som
 * `ui`-felt over Sidelayout på Sider og Forside. Leser blokk-lista live fra
 * skjema-tilstanden og varsler når siden bryter retningslinjene i
 * docs/COMPOSITION.md (for mange fargepaneler, to paneler inntil hverandre,
 * dobbel hero, samme CTA flere ganger, osv.). KUN veiledning — blokkerer
 * aldri lagring. Søsteren til TextCheck på richText-innhold og
 * AI-kvalitetsvurderingen på Guider, men uten AI: reglene er deterministiske
 * og kjører i nettleseren mens en redigerer.
 */

interface BlockInfo {
  index: number;
  blockType: string;
  /** Teller blokka som mettet fargepanel i panel-rasjoneringen? */
  isPanel: boolean;
  primaryCtaUrl?: string;
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
      text: `Siden har ${panels.length} seksjoner med farget bakgrunn (${panels
        .map((p) => `${label(p.blockType)} i seksjon ${p.index + 1}`)
        .join(
          ", "
        )}). To holder — endre f.eks. et Tall-bånd til «Delt», eller en CTA til «Enkel».`,
    });
  }

  // 2. Aldri to fargepaneler rett etter hverandre.
  for (let i = 1; i < blocks.length; i++) {
    if (blocks[i].isPanel && blocks[i - 1].isPanel) {
      findings.push({
        level: "advarsel",
        text: `${label(blocks[i - 1].blockType)} (seksjon ${
          blocks[i - 1].index + 1
        }) og ${label(blocks[i].blockType)} (seksjon ${
          blocks[i].index + 1
        }) har begge farget bakgrunn og ligger rett etter hverandre — legg en rolig seksjon mellom, eller endre den ene.`,
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
      text: "Hero-blokka ligger ikke øverst — den fungerer best som sidens første seksjon.",
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
  const urls = new Map<string, BlockInfo[]>();
  for (const b of blocks) {
    if (b.primaryCtaUrl) {
      const list = urls.get(b.primaryCtaUrl) ?? [];
      list.push(b);
      urls.set(b.primaryCtaUrl, list);
    }
  }
  for (const [url, sameUrl] of urls) {
    if (sameUrl.length > 1) {
      const navn = sameUrl.map(
        (b) => `${label(b.blockType)} (seksjon ${b.index + 1})`
      );
      const hvor = `${navn.slice(0, -1).join(", ")} og ${navn[navn.length - 1]}`;
      findings.push({
        level: "tips",
        text: `${hvor} har ${sameUrl.length === 2 ? "begge" : "alle"} knapp som peker til «${url}». Én hovedknapp per side er tydeligere — de andre seksjonene kan godt stå uten knapp.`,
      });
    }
  }

  // 6. Veldig mange blokker → siden mister retning.
  if (blocks.length > 12) {
    findings.push({
      level: "tips",
      text: `Siden har ${blocks.length} seksjoner — det kan bli mye å scrolle gjennom. Vurder å slå sammen noen, eller flytte innhold til en egen side.`,
    });
  }

  return findings;
}

const GUIDELINES: string[] = [
  "Alle seksjoner har samme bredde og starter på samme venstrekant — det ordner blokkene selv.",
  "Overskrifter står til venstre. Bare hero og siste CTA er midtstilt.",
  "Maks to seksjoner med farget bakgrunn per side — og aldri to rett etter hverandre.",
  "Velg én ting du vil at leseren skal gjøre. Ikke alle seksjoner trenger en knapp.",
  "Hero øverst, nyhetsbrev nederst. Avstanden mellom seksjoner er alltid den samme.",
];

export const CompositionCheck = () => {
  const [fields] = useAllFormFields();
  const blocks = readBlocks(
    fields as unknown as Record<string, { value?: unknown }>
  );
  const findings = analyse(blocks);

  return (
    <CheckPanel
      title="Sidesjekk"
      intro="Ser over oppbyggingen av siden mens du jobber, og sier ifra hvis noe bør flyttes eller endres."
      findings={findings}
      showStatus={blocks.length > 0}
      guidelinesLabel="Huskeregler for en ryddig side"
      guidelines={GUIDELINES}
    />
  );
};
