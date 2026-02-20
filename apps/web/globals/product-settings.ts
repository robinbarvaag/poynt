import type { GlobalConfig } from "payload";

export const ProductSettings: GlobalConfig = {
  slug: "productSettings",
  label: "Produktinnstillinger",
  admin: {
    group: "Innstillinger",
  },
  fields: [
    {
      name: "benefits",
      type: "array",
      label: "Tilgjengelige fordeler",
      admin: {
        description:
          "Definer fordeler som kan velges på produkter (f.eks. 'Livstidstilgang', 'PDF-nedlasting')",
      },
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
          label: "Tekst",
          admin: {
            description: "Teksten som vises til kunden",
          },
        },
        {
          name: "key",
          type: "text",
          required: true,
          label: "Nøkkel",
          admin: {
            description: "Unik identifikator (f.eks. 'lifetime-access')",
          },
        },
      ],
    },
  ],
};
