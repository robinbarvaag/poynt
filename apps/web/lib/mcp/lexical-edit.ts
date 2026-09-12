/**
 * Kirurgiske endringer i et Lexical-dokument for MCP: finn/erstatt i
 * tekstnodene uten å gå via markdown. Da overlever alt markdown-rundturen
 * mister (produktkort, innfelte bilder, nummererte lister, lenketyper).
 */

type Node = {
  type?: string;
  tag?: string;
  listType?: string;
  text?: string;
  fields?: { blockType?: string; product?: unknown };
  children?: Node[];
};

const isProductCard = (node: Node) =>
  node.type === "block" && node.fields?.blockType === "productSpotlight";

/** Produkt-ID-ene produktkortene i dokumentet peker på (unike). */
export function productCardIds(content: unknown): number[] {
  const ids = new Set<number>();
  const walk = (node: Node | undefined) => {
    if (!node || typeof node !== "object") return;
    if (isProductCard(node)) {
      const ref = node.fields?.product;
      const id = Number(
        typeof ref === "object" && ref ? (ref as { id: unknown }).id : ref
      );
      if (Number.isFinite(id)) ids.add(id);
    }
    for (const child of node.children ?? []) walk(child);
  };
  walk((content as { root?: Node })?.root);
  return [...ids];
}

/** Nodetyper markdownToLexical kan gjenskape uten tap. */
const MARKDOWN_SAFE = new Set([
  "root",
  "paragraph",
  "heading",
  "list",
  "listitem",
  "quote",
  "text",
  "link",
  "autolink",
  "linebreak",
]);

const LABELS: Record<string, string> = {
  block: "blokk",
  upload: "innfelt bilde",
  relationship: "relasjon",
  horizontalrule: "skillelinje",
  table: "tabell",
  code: "kodeblokk",
};

/**
 * Det som går tapt hvis innholdet erstattes med markdown (unike beskrivelser).
 * Tom liste = trygt å sende hele innholdet som markdown.
 */
export function markdownLossyParts(content: unknown): string[] {
  const found = new Set<string>();
  const walk = (node: Node | undefined) => {
    if (!node || typeof node !== "object") return;
    const type = node.type ?? "";
    if (type && !MARKDOWN_SAFE.has(type) && !isProductCard(node)) {
      found.add(LABELS[type] ?? type);
    }
    if (type === "list" && node.listType && node.listType !== "bullet") {
      found.add("nummerert liste / sjekkliste");
    }
    if (
      type === "heading" &&
      node.tag &&
      !["h1", "h2", "h3"].includes(node.tag)
    ) {
      found.add(`${node.tag}-overskrift`);
    }
    for (const child of node.children ?? []) walk(child);
  };
  walk((content as { root?: Node })?.root);
  return [...found];
}

export type TextEdit = { find: string; replace: string };
export type TextEditResult = { find: string; matches: number };

/**
 * Erstatter tekst i tekstnodene. Treff må ligge innenfor én tekstnode
 * (fet/kursiv/lenke deler teksten i flere noder) — edits uten treff
 * rapporteres med `matches: 0` så kallstedet kan feile tydelig.
 */
export function applyTextEdits<T>(
  content: T,
  edits: TextEdit[]
): { content: T; results: TextEditResult[] } {
  const copy = structuredClone(content);
  const results = edits.map((e) => ({ find: e.find, matches: 0 }));
  const walk = (node: Node | undefined) => {
    if (!node || typeof node !== "object") return;
    if (node.type === "text" && typeof node.text === "string") {
      let value: string = node.text;
      for (const [i, edit] of edits.entries()) {
        if (!edit.find || !value.includes(edit.find)) continue;
        const parts: string[] = value.split(edit.find);
        results[i].matches += parts.length - 1;
        value = parts.join(edit.replace);
      }
      node.text = value;
    }
    for (const child of node.children ?? []) walk(child);
  };
  walk((copy as { root?: Node })?.root);
  return { content: copy, results };
}
