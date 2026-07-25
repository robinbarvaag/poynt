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
        { label: "Aksent 3 (mint)", value: "mint" },
        { label: "Aksent 1 (cream)", value: "saffron" },
        { label: "Aksent 2 (rosa)", value: "salmon" },
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
