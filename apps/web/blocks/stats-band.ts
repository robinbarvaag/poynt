import type { Block } from "payload";

export const StatsBand: Block = {
  slug: "statsBand",
  interfaceName: "StatsBandBlock",
  labels: { singular: "Tall-bånd", plural: "Tall-bånd" },
  fields: [
    {
      name: "eyebrow",
      type: "text",
      label: "Etikett (liten tekst over tittel)",
    },
    { name: "title", type: "text", label: "Tittel" },
    {
      name: "variant",
      type: "select",
      label: "Bånd-farge",
      defaultValue: "primary",
      options: [
        { label: "Grønn", value: "primary" },
        { label: "Salmon", value: "salmon" },
        { label: "Saffron", value: "saffron" },
      ],
    },
    {
      name: "stats",
      type: "array",
      label: "Tall",
      labels: { singular: "Tall", plural: "Tall" },
      minRows: 1,
      fields: [
        {
          name: "value",
          type: "number",
          required: true,
          label: "Verdi (teller opp til dette)",
        },
        { name: "prefix", type: "text", label: "Prefiks (f.eks. «kr »)" },
        { name: "suffix", type: "text", label: "Suffiks (f.eks. «+», «k+»)" },
        { name: "label", type: "text", required: true, label: "Etikett" },
      ],
    },
  ],
};
