import type { Block } from "payload";
import { sectionHeaderFields } from "./_shared";

/** Sammenleggbare seksjoner (accordion / Notion-toggle). */
export const GuideToggle: Block = {
  slug: "guideToggle",
  interfaceName: "GuideToggleBlock",
  labels: { singular: "Toggle", plural: "Toggles" },
  fields: [
    ...sectionHeaderFields,
    {
      name: "items",
      type: "array",
      label: "Punkter",
      labels: { singular: "Punkt", plural: "Punkter" },
      minRows: 1,
      fields: [
        { name: "title", type: "text", required: true, label: "Tittel" },
        { name: "content", type: "richText", label: "Innhold" },
      ],
    },
  ],
};
