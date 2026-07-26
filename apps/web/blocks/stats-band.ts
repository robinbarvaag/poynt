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
      name: "description",
      type: "textarea",
      label: "Brødtekst",
      admin: {
        description:
          "I «Bånd» vises den sentrert under tittelen, i «Delt» ved siden av tallene.",
      },
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
    {
      name: "cta",
      type: "group",
      label: "Knapp (valgfri)",
      fields: [
        { name: "text", type: "text", label: "Knappetekst" },
        { name: "url", type: "text", label: "Lenke" },
      ],
    },
    {
      // Presentasjonsvalg samlet nederst (kun visning — samme feltnavn/skjema).
      type: "collapsible",
      label: "Utseende",
      admin: { initCollapsed: true },
      fields: [
        {
          name: "layout",
          type: "select",
          label: "Layout",
          defaultValue: "band",
          options: [
            { label: "Bånd (fargepanel, sentrert)", value: "band" },
            { label: "Delt (tekst venstre, tall høyre)", value: "split" },
          ],
          admin: {
            description:
              "«Delt» ligger på sidens vanlige bakgrunn og teller ikke som fargepanel — bruk den når siden allerede har to fargepaneler (se komposisjonssjekken).",
          },
        },
        {
          name: "variant",
          type: "select",
          label: "Bånd-farge",
          defaultValue: "primary",
          options: [
            { label: "Grønn", value: "primary" },
            { label: "Aksent 2 (rosa)", value: "salmon" },
            { label: "Aksent 1 (cream)", value: "saffron" },
          ],
          admin: {
            condition: (_data, siblingData) => siblingData?.layout !== "split",
          },
        },
      ],
    },
  ],
};
