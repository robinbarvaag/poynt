import type { Block } from "payload";

/**
 * «Produktkort»: ett produkt presentert liggende med bilde, pris og kjøpsknapp.
 * Brukes både som sideblokk og inne i bloggteksten (Lexical BlocksFeature),
 * så et innlegg kan peke rett på produktet det handler om.
 */
export const ProductSpotlight: Block = {
  slug: "productSpotlight",
  interfaceName: "ProductSpotlightBlock",
  labels: {
    singular: "Produktkort",
    plural: "Produktkort",
  },
  fields: [
    {
      name: "product",
      type: "relationship",
      relationTo: "products",
      required: true,
      label: "Produkt",
      filterOptions: {
        active: { equals: true },
      },
      admin: {
        description: "Bilde, pris og merkelapp hentes fra produktet.",
      },
    },
    {
      name: "eyebrow",
      type: "text",
      label: "Ledetekst (valgfri)",
      admin: {
        description:
          "Liten tekst over produktnavnet, f.eks. «Anbefalt» eller «Omtalt i innlegget». Tom = produkttypen.",
      },
    },
    {
      name: "text",
      type: "textarea",
      label: "Egen tekst (valgfri)",
      admin: {
        description:
          "Erstatter produktets korte beskrivelse. Bruk den til å knytte produktet til det du skriver om.",
      },
    },
    {
      name: "showAddToCart",
      type: "checkbox",
      label: "Vis «Legg i handlekurv»-knapp",
      defaultValue: true,
      admin: {
        description:
          "Skjules automatisk for medlemskap, utsolgte produkter og produkter med varianter (de må velges på produktsiden).",
      },
    },
  ],
};
