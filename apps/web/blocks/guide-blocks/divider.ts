import type { Block } from "payload";

/** Skillelinje med valgfri etikett. */
export const GuideDivider: Block = {
  slug: "guideDivider",
  interfaceName: "GuideDividerBlock",
  labels: { singular: "Skille", plural: "Skiller" },
  fields: [
    {
      name: "label",
      type: "text",
      label: "Etikett (valgfritt)",
    },
  ],
};
