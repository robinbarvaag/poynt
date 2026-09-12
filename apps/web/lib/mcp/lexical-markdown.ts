import { lexicalToMarkdown as serialize } from "@/lib/serialize-guide-content";
import { type DocBlock, type ProductCard, richDoc } from "@/scripts/_lexical";

/**
 * «Produktkort» i markdown (kun blogginnlegg og kundehistorier), alltid på
 * egen linje: `[produktkort id=12 etikett="Anbefalt" tekst="…" kjøpsknapp=nei]`.
 * Bare id er påkrevd.
 */
const CARD_LINE = /^\[produktkort\b(.*)\]$/iu;
const CARD_ATTR = /([\p{L}_-]+)=(?:"((?:[^"\\]|\\.)*)"|(\S+))/gu;

export function parseProductCard(line: string): ProductCard | null {
  const match = CARD_LINE.exec(line.trim());
  if (!match) return null;
  const attrs: Record<string, string> = {};
  for (const a of match[1].matchAll(CARD_ATTR)) {
    attrs[a[1].toLowerCase()] =
      a[2] !== undefined ? a[2].replace(/\\(.)/g, "$1") : a[3];
  }
  const product = Number(attrs.id);
  if (!Number.isInteger(product) || product <= 0) return null;
  const buy = attrs.kjøpsknapp ?? attrs.kjopsknapp;
  return {
    product,
    ...(attrs.etikett ? { eyebrow: attrs.etikett } : {}),
    ...(attrs.tekst ? { text: attrs.tekst } : {}),
    showAddToCart: buy === undefined || !/^(nei|false|0|av)$/i.test(buy),
  };
}

const quoted = (value: string) =>
  `"${value.replace(/\s+/g, " ").replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

/** Produktkort-blokkens felt → markdown-linjen `parseProductCard` leser. */
export function productCardLine(fields: Record<string, unknown>) {
  const ref = fields.product;
  const id = typeof ref === "object" && ref ? (ref as { id: unknown }).id : ref;
  const parts = [`produktkort id=${id}`];
  if (typeof fields.eyebrow === "string" && fields.eyebrow.trim()) {
    parts.push(`etikett=${quoted(fields.eyebrow.trim())}`);
  }
  if (typeof fields.text === "string" && fields.text.trim()) {
    parts.push(`tekst=${quoted(fields.text.trim())}`);
  }
  if (fields.showAddToCart === false) parts.push("kjøpsknapp=nei");
  return `[${parts.join(" ")}]`;
}

/** Lexical → markdown for MCP, med produktkort som egne linjer. */
export function lexicalToMarkdown(content: unknown): string {
  return serialize(content, {
    block: (fields) =>
      fields.blockType === "productSpotlight"
        ? productCardLine(fields)
        : undefined,
  });
}

/**
 * Enkel markdown → Lexical for richText-felter som kommer inn via MCP.
 * Støtter det redaktøren faktisk bruker i innholdsblokker: avsnitt (skilt med
 * blank linje), `## `/`### ` overskrifter, `- ` punktlister og `> ` sitat.
 * Inline-formatering (`**fet**`, `_kursiv_`, `[lenke](url)`) blir ekte
 * Lexical-noder via `inlineNodes` i scripts/_lexical. Med `productCards`
 * blir `[produktkort id=…]`-linjer ekte Produktkort-blokker (kaster ved
 * ugyldig id). Motstykket til `lexicalToMarkdown`.
 */
export function markdownToLexical(
  markdown: string,
  options: { productCards?: boolean } = {}
) {
  const blocks: DocBlock[] = [];
  const chunks = markdown.replace(/\r\n/g, "\n").split(/\n\s*\n/);
  for (const chunk of chunks) {
    const lines = chunk
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length) continue;

    let paragraph: string[] = [];
    let list: string[] = [];
    const flush = () => {
      if (paragraph.length) {
        blocks.push(paragraph.join(" "));
        paragraph = [];
      }
      if (list.length) {
        blocks.push({ list });
        list = [];
      }
    };

    for (const line of lines) {
      if (options.productCards && CARD_LINE.test(line)) {
        const card = parseProductCard(line);
        if (!card) {
          throw new Error(
            `Produktkortet «${line}» mangler gyldig id=<produkt-ID> (fra list_related).`
          );
        }
        flush();
        blocks.push({ productCard: card });
        continue;
      }
      const heading = /^(#{1,3})\s+(.+)$/.exec(line);
      if (heading) {
        flush();
        blocks.push({
          heading: heading[2],
          level: heading[1].length >= 3 ? 3 : 2,
        });
        continue;
      }
      const item = /^(?:[-*•]|\d+\.)\s+(.+)$/.exec(line);
      if (item) {
        if (paragraph.length) flush();
        list.push(item[1]);
        continue;
      }
      const quote = /^>\s?(.+)$/.exec(line);
      if (quote) {
        flush();
        blocks.push({ quote: quote[1] });
        continue;
      }
      if (list.length) flush();
      paragraph.push(line);
    }
    flush();
  }
  // lexicalToMarkdown skiller alle linjer med blank linje, også listepunkter.
  // Slå sammen nabolister så rundturen gir ÉN liste, ikke én per punkt.
  const merged: DocBlock[] = [];
  for (const block of blocks) {
    const prev = merged[merged.length - 1];
    if (
      typeof block === "object" &&
      "list" in block &&
      prev &&
      typeof prev === "object" &&
      "list" in prev
    ) {
      prev.list.push(...block.list);
    } else {
      merged.push(block);
    }
  }
  return richDoc(merged);
}
