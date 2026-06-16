import type { Block } from "payload";

export const Pricing: Block = {
  slug: "pricing",
  interfaceName: "PricingBlock",
  labels: { singular: "Prisplaner", plural: "Prisplaner" },
  fields: [
    {
      name: "eyebrow",
      type: "text",
      label: "Etikett (liten tekst over tittel)",
    },
    { name: "title", type: "text", label: "Tittel" },
    { name: "intro", type: "textarea", label: "Ingress" },
    {
      name: "tiers",
      type: "array",
      label: "Planer",
      labels: { singular: "Plan", plural: "Planer" },
      minRows: 1,
      fields: [
        { name: "name", type: "text", required: true, label: "Navn" },
        {
          name: "price",
          type: "text",
          required: true,
          label: "Pris (tall, f.eks. «149»)",
        },
        { name: "period", type: "text", label: "Enhet (f.eks. «kr/mnd»)" },
        { name: "description", type: "textarea", label: "Beskrivelse" },
        {
          name: "features",
          type: "array",
          label: "Funksjoner",
          labels: { singular: "Funksjon", plural: "Funksjoner" },
          fields: [
            { name: "text", type: "text", required: true, label: "Tekst" },
          ],
        },
        { name: "ctaText", type: "text", required: true, label: "Knappetekst" },
        { name: "ctaUrl", type: "text", required: true, label: "Knappe-URL" },
        {
          name: "featured",
          type: "checkbox",
          label: "Fremhev denne planen (anbefalt)",
        },
        {
          name: "badge",
          type: "text",
          label: "Merkelapp (f.eks. «Mest populær»)",
        },
      ],
    },
  ],
};
