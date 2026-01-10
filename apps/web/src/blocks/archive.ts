import type { Block } from "payload";

export const Archive: Block = {
  slug: "archive",
  interfaceName: "ArchiveBlock",
  fields: [
    {
      name: "title",
      type: "text",
      label: "Tittel",
    },
    {
      name: "populateBy",
      type: "select",
      label: "Populer med",
      defaultValue: "selection",
      options: [
        {
          label: "Manuelt valg",
          value: "selection",
        },
        {
          label: "Alle produkt",
          value: "all",
        },
      ],
    },
    {
      name: "selectedProducts",
      type: "relationship",
      relationTo: "products",
      hasMany: true,
      label: "Valgte produkt",
      admin: {
        condition: (data) => data.populateBy === "selection",
      },
    },
  ],
};
