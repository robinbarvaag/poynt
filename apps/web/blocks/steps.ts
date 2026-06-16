import type { Block } from "payload";

export const Steps: Block = {
  slug: "steps",
  interfaceName: "StepsBlock",
  labels: { singular: "Stegliste («Slik funker det»)", plural: "Steglister" },
  fields: [
    {
      name: "eyebrow",
      type: "text",
      label: "Etikett (liten tekst over tittel)",
    },
    { name: "title", type: "text", label: "Tittel" },
    { name: "intro", type: "textarea", label: "Ingress" },
    {
      name: "steps",
      type: "array",
      label: "Steg",
      labels: { singular: "Steg", plural: "Steg" },
      minRows: 1,
      fields: [
        { name: "title", type: "text", required: true, label: "Tittel" },
        { name: "text", type: "textarea", required: true, label: "Tekst" },
      ],
    },
  ],
};
