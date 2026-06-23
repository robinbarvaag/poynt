import type { Block } from "payload";

/** Farget callout-boks med emoji-ikon (à la Notion-callout). */
export const GuideCallout: Block = {
  slug: "guideCallout",
  interfaceName: "GuideCalloutBlock",
  labels: { singular: "Callout", plural: "Callouts" },
  fields: [
    {
      name: "tone",
      type: "select",
      label: "Farge",
      defaultValue: "mint",
      options: [
        { label: "Mint", value: "mint" },
        { label: "Saffron", value: "saffron" },
        { label: "Salmon", value: "salmon" },
        { label: "Grønn", value: "primary" },
        { label: "Mørk", value: "ink" },
      ],
    },
    {
      name: "icon",
      type: "text",
      label: "Emoji-ikon",
      admin: { description: "F.eks. 💡, ✨, 📌" },
    },
    {
      name: "content",
      type: "richText",
      required: true,
      label: "Innhold",
    },
  ],
};
