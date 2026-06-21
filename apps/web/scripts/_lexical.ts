const textNode = (text: string) => ({
  type: "text",
  mode: "normal" as const,
  text,
  detail: 0,
  format: 0,
  style: "",
  version: 1,
});

const paragraphNode = (text: string) => ({
  type: "paragraph",
  format: "" as const,
  indent: 0,
  version: 1,
  direction: "ltr" as const,
  textFormat: 0,
  children: [textNode(text)],
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
  | { list: string[] };

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
        children: [textNode(block.heading)],
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
        children: [textNode(item)],
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
