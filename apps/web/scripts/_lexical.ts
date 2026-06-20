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
      children: paragraphs.map((text) => ({
        type: "paragraph",
        format: "" as const,
        indent: 0,
        version: 1,
        direction: "ltr" as const,
        textFormat: 0,
        children: [
          {
            type: "text",
            mode: "normal" as const,
            text,
            detail: 0,
            format: 0,
            style: "",
            version: 1,
          },
        ],
      })),
    },
  };
}
