const textNode = (text: string, format = 0) => ({
  type: "text",
  mode: "normal" as const,
  text,
  detail: 0,
  format,
  style: "",
  version: 1,
});

/**
 * Lenkefelt som i editoren (se lib/lexical/link-feature.ts): `mailto:` og
 * `tel:` i markdown blir e-post-/telefonlenker med popover på nettsiden,
 * alt annet en vanlig nettadresse.
 */
const linkFields = (url: string) => {
  const mailto = /^mailto:([^?]+)/i.exec(url);
  if (mailto?.[1]) {
    return { linkType: "email" as const, email: mailto[1], url, newTab: false };
  }
  const tel = /^tel:(.+)$/i.exec(url);
  if (tel?.[1]) {
    return { linkType: "phone" as const, phone: tel[1], url, newTab: false };
  }
  return { linkType: "custom" as const, url, newTab: false };
};

const linkNode = (label: string, url: string, format: number) => ({
  type: "link",
  fields: linkFields(url),
  format: "" as const,
  indent: 0,
  version: 3,
  direction: "ltr" as const,
  children: [textNode(label, format)],
});

const FORMAT_BOLD = 1;
const FORMAT_ITALIC = 2;

/**
 * Enkel inline-markdown → Lexical-noder: `**fet**`, `_kursiv_`/`*kursiv*` og
 * `[tekst](url)`. Motstykket til `lexicalToMarkdown`, slik at innhold hentet
 * via MCP kan sendes tilbake uendret uten at markørene havner som ren tekst.
 * Alt annet (kode, bilder osv.) beholdes som det står.
 */
const INLINE =
  /\[([^\]]+)\]\(([^)\s]+)\)|\*\*(.+?)\*\*|(?<![\w*])[_*](?=\S)(.+?)(?<=\S)[_*](?![\w*])/g;

export function inlineNodes(text: string, format = 0) {
  const nodes: Array<
    ReturnType<typeof textNode> | ReturnType<typeof linkNode>
  > = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    const start = m.index ?? 0;
    if (start > last) nodes.push(textNode(text.slice(last, start), format));
    const [, linkLabel, linkUrl, bold, italic] = m;
    if (linkLabel !== undefined && linkUrl !== undefined) {
      nodes.push(linkNode(linkLabel, linkUrl, format));
    } else if (bold !== undefined) {
      nodes.push(...inlineNodes(bold, format | FORMAT_BOLD));
    } else if (italic !== undefined) {
      nodes.push(...inlineNodes(italic, format | FORMAT_ITALIC));
    }
    last = start + m[0].length;
  }
  if (last < text.length) nodes.push(textNode(text.slice(last), format));
  return nodes.length ? nodes : [textNode(text, format)];
}

const paragraphNode = (text: string) => ({
  type: "paragraph",
  format: "" as const,
  indent: 0,
  version: 1,
  direction: "ltr" as const,
  textFormat: 0,
  children: inlineNodes(text),
});

/**
 * Bygger et minimalt Lexical-dokument for Payload richText-felter fra ren tekst.
 * Gir én eller flere avsnitt (paragraph-noder). Delt av seed-skriptene.
 */
export function richText(input: string | string[]) {
  const paragraphs = Array.isArray(input) ? input : [input];
  return {
    root: {
      type: "root",
      format: "" as const,
      indent: 0,
      version: 1,
      direction: "ltr" as const,
      children: paragraphs.map(paragraphNode),
    },
  };
}

/**
 * En blokk i et rikere Lexical-dokument: ren streng = avsnitt,
 * `{ heading }` = overskrift (h2 som standard), `{ list }` = punktliste.
 */
export type DocBlock =
  | string
  | { heading: string; level?: 2 | 3 }
  | { list: string[] }
  | { quote: string }
  | { productCard: ProductCard };

/** Feltene i «Produktkort»-blokken (blocks/product-spotlight.ts). */
export interface ProductCard {
  product: number;
  eyebrow?: string;
  text?: string;
  showAddToCart?: boolean;
}

/** Blokk-ID i samme format som Payload bruker (24 hex-tegn). */
const blockId = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) =>
    b.toString(16).padStart(2, "0")
  ).join("");

/**
 * Bygger et Lexical-dokument med overskrifter og punktlister i tillegg til
 * avsnitt. Brukes til lengre tekstsider som personvern og kjøpsbetingelser.
 */
export function richDoc(blocks: DocBlock[]) {
  const children = blocks.map((block) => {
    if (typeof block === "string") {
      return paragraphNode(block);
    }
    if ("heading" in block) {
      return {
        type: "heading",
        tag: `h${block.level ?? 2}` as const,
        format: "" as const,
        indent: 0,
        version: 1,
        direction: "ltr" as const,
        children: inlineNodes(block.heading),
      };
    }
    if ("productCard" in block) {
      const {
        product,
        eyebrow,
        text,
        showAddToCart = true,
      } = block.productCard;
      return {
        type: "block",
        format: "" as const,
        version: 2,
        fields: {
          id: blockId(),
          blockName: "",
          blockType: "productSpotlight",
          product,
          ...(eyebrow ? { eyebrow } : {}),
          ...(text ? { text } : {}),
          showAddToCart,
        },
      };
    }
    if ("quote" in block) {
      return {
        type: "quote",
        format: "" as const,
        indent: 0,
        version: 1,
        direction: "ltr" as const,
        children: inlineNodes(block.quote),
      };
    }
    return {
      type: "list",
      listType: "bullet" as const,
      tag: "ul" as const,
      start: 1,
      format: "" as const,
      indent: 0,
      version: 1,
      direction: "ltr" as const,
      children: block.list.map((item, index) => ({
        type: "listitem",
        value: index + 1,
        format: "" as const,
        indent: 0,
        version: 1,
        direction: "ltr" as const,
        children: inlineNodes(item),
      })),
    };
  });

  return {
    root: {
      type: "root",
      format: "" as const,
      indent: 0,
      version: 1,
      direction: "ltr" as const,
      children,
    },
  };
}
