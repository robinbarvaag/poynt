import type { Block } from "payload";

export const CountdownBlock: Block = {
  slug: "countdown",
  interfaceName: "CountdownBlock",
  labels: {
    singular: "Nedtelling",
    plural: "Nedtellinger",
  },
  fields: [
    {
      name: "eyebrow",
      type: "text",
      label: "Etikett (liten tekst over tittel)",
    },
    { name: "title", type: "text", label: "Tittel" },
    { name: "description", type: "textarea", label: "Beskrivelse" },
    {
      name: "targetDate",
      type: "date",
      required: true,
      label: "Teller ned til",
      admin: {
        date: { pickerAppearance: "dayAndTime" },
        description: "Datoen og klokkeslettet nedtellingen skal treffe.",
      },
    },
    {
      name: "doneLabel",
      type: "text",
      label: "Tekst når datoen har passert",
      admin: {
        description:
          "Vises i stedet for tallene, f.eks. «Boka er her!». Da kan seksjonen stå til du rekker å bytte den ut.",
      },
    },
    {
      name: "cta",
      type: "group",
      label: "Knapp (valgfritt)",
      fields: [
        { name: "text", type: "text", label: "Knappetekst" },
        { name: "url", type: "text", label: "Lenke" },
      ],
    },
    {
      type: "collapsible",
      label: "Utseende",
      admin: { initCollapsed: true },
      fields: [
        {
          name: "variant",
          type: "select",
          label: "Panel-farge",
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
