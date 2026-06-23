import type { Block } from "payload";

/** Vanlig brødtekst: avsnitt, overskrifter, lister og sitater (Lexical). */
export const GuideRichText: Block = {
  slug: "guideRichText",
  interfaceName: "GuideRichTextBlock",
  labels: { singular: "Tekst", plural: "Tekst" },
  fields: [
    {
      name: "content",
      type: "richText",
      required: true,
      label: "Innhold",
    },
  ],
};
