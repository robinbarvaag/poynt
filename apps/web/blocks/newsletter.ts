import type { Block } from "payload";

export const Newsletter: Block = {
  slug: "newsletter",
  interfaceName: "NewsletterBlock",
  labels: { singular: "Nyhetsbrev-bånd", plural: "Nyhetsbrev-bånd" },
  fields: [
    {
      name: "eyebrow",
      type: "text",
      label: "Etikett (liten tekst over tittel)",
    },
    { name: "title", type: "text", required: true, label: "Tittel" },
    { name: "description", type: "textarea", label: "Beskrivelse" },
    { name: "buttonText", type: "text", label: "Knappetekst" },
    { name: "placeholder", type: "text", label: "Plassholder i e-postfeltet" },
    {
      // Presentasjonsvalg samlet nederst (kun visning — samme feltnavn/skjema).
      type: "collapsible",
      label: "Utseende",
      admin: { initCollapsed: true },
      fields: [
        {
          name: "variant",
          type: "select",
          label: "Bånd-farge",
          defaultValue: "primary",
          options: [
            { label: "Grønn", value: "primary" },
            { label: "Aksent 1 (cream)", value: "saffron" },
            { label: "Aksent 2 (rosa)", value: "salmon" },
          ],
        },
      ],
    },
  ],
};
