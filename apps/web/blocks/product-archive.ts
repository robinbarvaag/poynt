import type { Block } from "payload";

export const ProductArchive: Block = {
  slug: "productArchive",
  interfaceName: "ProductArchiveBlock",
  labels: {
    singular: "Produkter-seksjon",
    plural: "Produkter-seksjoner",
  },
  fields: [
    {
      name: "title",
      type: "text",
      label: "Tittel",
    },
    {
      name: "description",
      type: "textarea",
      label: "Beskrivelse",
    },
    {
      name: "selectionMode",
      type: "select",
      label: "Velg produkter",
      defaultValue: "auto",
      options: [
        { label: "Automatisk (alle aktive)", value: "auto" },
        { label: "Manuelt utvalg", value: "manual" },
      ],
    },
    {
      name: "selectedProducts",
      type: "relationship",
      relationTo: "products",
      hasMany: true,
      label: "Velg produkter",
      admin: {
        condition: (_data, siblingData) =>
          siblingData?.selectionMode === "manual",
        description:
          "Velg hvilke produkter som skal vises. Rekkefølgen her styrer rekkefølgen i rutenettet.",
      },
    },
    {
      name: "featuredProduct",
      type: "relationship",
      relationTo: "products",
      label: "Fremhevet produkt",
      admin: {
        condition: (_data, siblingData) =>
          siblingData?.selectionMode === "manual",
        description:
          "Vises som et stort, fremhevet kort først i rutenettet. Trenger ikke å være med i utvalget over.",
      },
    },
    {
      name: "filterByType",
      type: "select",
      label: "Filtrer på produkttype",
      options: [
        { label: "Alle produkter", value: "all" },
        { label: "Kun produkter", value: "product" },
        { label: "Kun kurs", value: "course" },
        { label: "Kun PDF-er", value: "pdf" },
        { label: "Kun bundles", value: "bundle" },
      ],
      defaultValue: "all",
      admin: {
        condition: (_data, siblingData) =>
          siblingData?.selectionMode === "auto",
      },
    },
    {
      name: "limit",
      type: "number",
      label: "Maks antall produkter",
      defaultValue: 8,
      admin: {
        description: "La stå tom for å vise alle",
        condition: (_data, siblingData) =>
          siblingData?.selectionMode === "auto",
      },
    },
    {
      // Presentasjonsvalg samlet nederst (kun visning — samme feltnavn/skjema).
      type: "collapsible",
      label: "Utseende",
      admin: { initCollapsed: true },
      fields: [
        {
          name: "featureFirst",
          type: "checkbox",
          label: "Fremhev første produkt (stort kort)",
          defaultValue: false,
          admin: {
            condition: (_data, siblingData) =>
              siblingData?.selectionMode === "auto",
            description:
              "Det nyeste produktet vises som et stort kort over to kolonner.",
          },
        },
        {
          name: "showMoreLink",
          type: "checkbox",
          label: "Vis 'Se alle produkter'-lenke",
          defaultValue: false,
        },
      ],
    },
  ],
};
