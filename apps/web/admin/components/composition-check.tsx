"use client";

import {
  type BlockInfo,
  COMPOSITION_GUIDELINES,
  analyseComposition,
  isPanelBlock,
} from "@/lib/composition-rules";
import { useAllFormFields } from "@payloadcms/ui";
import { CheckPanel } from "./check-panel";

/**
 * «Sidesjekk» — regelbasert vakt for sideoppbygging, montert som
 * `ui`-felt over Sidelayout på Sider og Forside. Leser blokk-lista live fra
 * skjema-tilstanden og varsler når siden bryter retningslinjene i
 * docs/COMPOSITION.md (for mange fargepaneler, to paneler inntil hverandre,
 * dobbel hero, samme CTA flere ganger, osv.). Selve reglene bor i
 * lib/composition-rules.ts og deles med MCP-serveren. KUN veiledning —
 * blokkerer aldri lagring. Søsteren til TextCheck på richText-innhold og
 * AI-kvalitetsvurderingen på Guider, men uten AI: reglene er deterministiske
 * og kjører i nettleseren mens en redigerer.
 */

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

    const primaryCtaUrl =
      typeof get("primaryCta.url") === "string"
        ? (get("primaryCta.url") as string)
        : undefined;
    const eyebrow =
      typeof get("eyebrow") === "string"
        ? (get("eyebrow") as string).trim()
        : undefined;
    const title =
      typeof get("title") === "string"
        ? (get("title") as string).trim()
        : undefined;

    blocks.push({
      index,
      blockType,
      isPanel: isPanelBlock(blockType, get),
      primaryCtaUrl,
      eyebrow,
      title,
    });
  }
  return blocks.sort((a, b) => a.index - b.index);
}

export const CompositionCheck = () => {
  const [fields] = useAllFormFields();
  const blocks = readBlocks(
    fields as unknown as Record<string, { value?: unknown }>
  );
  const findings = analyseComposition(blocks);

  return (
    <CheckPanel
      title="Sidesjekk"
      intro="Ser over oppbyggingen av siden mens du jobber, og sier ifra hvis noe bør flyttes eller endres."
      findings={findings}
      showStatus={blocks.length > 0}
      guidelinesLabel="Huskeregler for en ryddig side"
      guidelines={COMPOSITION_GUIDELINES}
    />
  );
};
