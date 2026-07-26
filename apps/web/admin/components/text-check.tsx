"use client";

import { useAllFormFields, useDocumentInfo } from "@payloadcms/ui";
import { CheckPanel, type Finding } from "./check-panel";

/**
 * «Innleggssjekk»/«Historiesjekk» — regelbasert vakt for richText-innhold,
 * montert som `ui`-felt under «Hjelp og kvalitet». Søsteren til Sidesjekken
 * på Sider/Forside, men der den leser blokk-lista, leser denne selve teksten
 * (Lexical-innholdet) live fra skjema-tilstanden: mellomtitler, avsnitt som
 * blir for lange, tittel- og utdragslengde som Google kutter, og lignende.
 * De generiske tekstreglene deles av alle innholdstyper; config-drevet på
 * collectionSlug (samme mønster som ContentGuidelines) for titler,
 * huskeregler og eventuelle egne regler per type. KUN veiledning — blokkerer
 * aldri lagring.
 */

type Fields = Record<string, { value?: unknown }>;

/** Løst typet Lexical-node — vi bryr oss bare om type/tag/children/text. */
interface LexicalNode {
  type?: string;
  tag?: string;
  text?: string;
  children?: LexicalNode[];
}

interface ContentStats {
  wordCount: number;
  h1Count: number;
  h2Count: number;
  /** Ordtelling per avsnitt, i rekkefølge. */
  paragraphWords: number[];
  /** Første avsnitts tekst (kroken). */
  firstParagraph: string;
  /** All ren tekst i innholdet, til enkle søk. */
  plainText: string;
  linkCount: number;
  /** Lengste strekk med ord uten mellomtittel. */
  longestStretchWithoutHeading: number;
}

const countWords = (text: string): number =>
  text.trim() ? text.trim().split(/\s+/).length : 0;

function nodeText(node: LexicalNode): string {
  if (typeof node.text === "string") return node.text;
  return (node.children ?? []).map(nodeText).join("");
}

function countLinks(node: LexicalNode): number {
  const own = node.type === "link" || node.type === "autolink" ? 1 : 0;
  return own + (node.children ?? []).reduce((sum, c) => sum + countLinks(c), 0);
}

function readContent(value: unknown): ContentStats | null {
  const root = (value as { root?: LexicalNode } | undefined)?.root;
  if (!root || !Array.isArray(root.children)) return null;

  const stats: ContentStats = {
    wordCount: 0,
    h1Count: 0,
    h2Count: 0,
    paragraphWords: [],
    firstParagraph: "",
    plainText: "",
    linkCount: 0,
    longestStretchWithoutHeading: 0,
  };

  let stretch = 0;
  for (const node of root.children) {
    const text = nodeText(node);
    const words = countWords(text);
    stats.wordCount += words;
    stats.plainText += `${text}\n`;
    stats.linkCount += countLinks(node);

    if (node.type === "heading") {
      if (node.tag === "h1") stats.h1Count++;
      if (node.tag === "h2") stats.h2Count++;
      stats.longestStretchWithoutHeading = Math.max(
        stats.longestStretchWithoutHeading,
        stretch
      );
      stretch = 0;
    } else {
      stretch += words;
      if (node.type === "paragraph" && words > 0) {
        stats.paragraphWords.push(words);
        if (!stats.firstParagraph) stats.firstParagraph = text.trim();
      }
    }
  }
  stats.longestStretchWithoutHeading = Math.max(
    stats.longestStretchWithoutHeading,
    stretch
  );

  return stats;
}

/**
 * De generiske tekstreglene — gjelder ALT richText-innhold, uansett type:
 * lengder Google kutter, tom SEO-fane, mellomtitler, avsnittslengde, tynt
 * innhold og manglende lenker.
 */
function analyseText(
  fields: Fields,
  stats: ContentStats | null,
  paths?: { titlePath?: string; excerptPath?: string }
): Finding[] {
  const findings: Finding[] = [];

  const title = String(fields[paths?.titlePath ?? "title"]?.value ?? "").trim();
  const excerpt = String(
    fields[paths?.excerptPath ?? "excerpt"]?.value ?? ""
  ).trim();
  const metaTitle = String(fields["meta.title"]?.value ?? "").trim();
  const metaDescription = String(
    fields["meta.description"]?.value ?? ""
  ).trim();

  // 1. Tittel-lengde: Google kutter rundt 60 tegn.
  if (title.length > 65) {
    findings.push({
      level: "tips",
      text: `Tittelen er ${title.length} tegn — Google viser bare rundt 60. Sett det viktigste først, eller kort den ned.`,
    });
  }

  // 2. Utdrag-lengde: brukes som beskrivelse i søkeresultatet.
  if (excerpt.length > 160) {
    findings.push({
      level: "tips",
      text: `Utdraget er ${excerpt.length} tegn — Google kutter rundt 155. Det viktigste bør stå i første del.`,
    });
  }

  // 3. SEO-fanen: beskrivelsen Google faktisk viser.
  if ((title || excerpt) && !metaTitle && !metaDescription) {
    findings.push({
      level: "tips",
      text: "SEO-fanen er tom — fyll ut meta-tittel og meta-beskrivelse der, så bestemmer du selv hva Google viser.",
    });
  }

  if (!stats || stats.wordCount === 0) return findings;

  // 4. H1 i brødteksten — tittelen er allerede sidens H1.
  if (stats.h1Count > 0) {
    findings.push({
      level: "advarsel",
      text: "Innholdet har en H1-overskrift — tittelen øverst er allerede sidens hovedoverskrift. Bruk H2 for mellomtitler.",
    });
  }

  // 5. Mellomtitler for skumleseren (og Google).
  if (stats.wordCount >= 250 && stats.h2Count === 0) {
    findings.push({
      level: "advarsel",
      text: `Teksten har ${stats.wordCount} ord uten en eneste mellomtittel (H2). Skumleseren — og Google — bruker mellomtitlene til å forstå hva den handler om.`,
    });
  } else if (stats.longestStretchWithoutHeading > 300) {
    findings.push({
      level: "tips",
      text: `Ett parti i teksten går ${stats.longestStretchWithoutHeading} ord uten mellomtittel — vurder å dele det opp, så blir det lettere å skumme.`,
    });
  }

  // 6. Avsnitt som blir for lange.
  const longParagraphs = stats.paragraphWords.filter((w) => w > 90).length;
  if (longParagraphs > 0) {
    findings.push({
      level: "tips",
      text:
        longParagraphs === 1
          ? "Ett avsnitt er på over 90 ord — del det gjerne i to, korte avsnitt er lettere å lese på mobil."
          : `${longParagraphs} avsnitt er på over 90 ord — del dem gjerne opp, korte avsnitt er lettere å lese på mobil.`,
    });
  }

  // 7. Kroken: ikke start med å love hva teksten «skal se på».
  if (
    /^i (denne|dette) (artikkelen|innlegget|bloggposten|kundehistorien|historien|teksten)/i.test(
      stats.firstParagraph
    )
  ) {
    findings.push({
      level: "advarsel",
      text: "Første setning starter med «I denne artikkelen …» — hopp rett til problemet eller poenget i stedet, det er kroken som får leseren til å bli.",
    });
  }

  // 8. Tynt innhold i Googles øyne.
  if (stats.wordCount < 300) {
    findings.push({
      level: "tips",
      text: `Teksten er på ${stats.wordCount} ord — under ~300 sliter den med å hevde seg i Google. Er det mer å si, eller passer den bedre som del av noe annet?`,
    });
  }

  // 9. Landingen: lenk leseren videre.
  if (stats.wordCount >= 300 && stats.linkCount === 0) {
    findings.push({
      level: "tips",
      text: "Teksten har ingen lenker — lenk gjerne til en tjeneste, guide eller kundehistorie, så har leseren et neste steg (og Google liker interne lenker).",
    });
  }

  return findings;
}

/** Huskeregler som gjelder all richText — per-type-reglene legges etter. */
const SHARED_GUIDELINES: string[] = [
  "Tittel under ~60 tegn og utdrag under ~155 — da vises alt i Google.",
  "Mellomtitler (H2) cirka hvert 200.–300. ord — overskriftene alene skal fortelle historien.",
  "Korte avsnitt: 2–4 setninger. Det som ser greit ut på PC, blir en vegg på mobil.",
  "Start med problemet eller poenget — aldri «I denne artikkelen skal vi …».",
];

interface TextCheckConfig {
  title: string;
  intro: string;
  /** Feltnavn for tittel/utdrag når typen ikke bruker `title`/`excerpt`. */
  titlePath?: string;
  excerptPath?: string;
  /** Regler som bare gjelder denne innholdstypen. */
  extraChecks?: (fields: Fields, stats: ContentStats | null) => Finding[];
  extraGuidelines: string[];
}

const CONFIGS: Record<string, TextCheckConfig> = {
  "blog-posts": {
    title: "Innleggssjekk",
    intro:
      "Ser over teksten mens du skriver, og sier ifra hvis noe gjør innlegget tyngre å lese — eller vanskeligere å finne i Google.",
    extraGuidelines: [
      "Avslutt med et neste steg: lenk til en tjeneste, guide eller kundehistorie.",
    ],
  },
  "case-studies": {
    title: "Historiesjekk",
    intro:
      "Ser over historien mens du skriver, og sier ifra hvis noe gjør den tyngre å lese — eller mindre troverdig som salgsbevis.",
    extraChecks: (fields, stats) => {
      const findings: Finding[] = [];
      const customer = String(fields.customer?.value ?? "").trim();

      // Historien bør faktisk nevne kunden den handler om.
      if (
        customer &&
        stats &&
        stats.wordCount >= 100 &&
        !stats.plainText.toLowerCase().includes(customer.toLowerCase())
      ) {
        findings.push({
          level: "tips",
          text: `Teksten nevner aldri «${customer}» — bruk navnet i historien, det gjør den mer personlig og troverdig.`,
        });
      }
      return findings;
    },
    extraGuidelines: [
      "Fortell i tre deler: utfordringen → hva vi gjorde → resultatet.",
      "Bruk kundens navn i teksten — historien handler om dem, ikke om oss.",
    ],
  },
  services: {
    title: "Tjenestesjekk",
    intro:
      "Ser over beskrivelsen mens du skriver, og sier ifra hvis noe gjør tjenesten tyngre å forstå — eller vanskeligere å si ja til.",
    titlePath: "name",
    excerptPath: "shortDescription",
    extraGuidelines: [
      "Si hva kunden får, ikke hva vi gjør — «en ferdig innholdsplan» slår «hjelp med innhold».",
      "Avslutt med neste steg: hva skjer når kunden tar kontakt?",
    ],
  },
};

export const TextCheck = () => {
  const { collectionSlug } = useDocumentInfo();
  const [fields] = useAllFormFields();
  const config = collectionSlug ? CONFIGS[collectionSlug] : undefined;
  if (!config) return null;

  const typedFields = fields as unknown as Fields;
  const stats = readContent(typedFields.content?.value);
  const findings = [
    ...analyseText(typedFields, stats, config),
    ...(config.extraChecks?.(typedFields, stats) ?? []),
  ];
  const hasContent = (stats?.wordCount ?? 0) > 0;

  return (
    <CheckPanel
      title={config.title}
      intro={
        <>
          {config.intro}
          {hasContent && ` Nå: ${stats?.wordCount} ord.`}
        </>
      }
      findings={findings}
      showStatus={hasContent}
      guidelinesLabel="Huskeregler for en lettlest tekst"
      guidelines={[...SHARED_GUIDELINES, ...config.extraGuidelines]}
    />
  );
};
