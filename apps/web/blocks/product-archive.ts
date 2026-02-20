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
        condition: (data) => data?.selectionMode === "manual",
        description: "Velg hvilke produkter som skal vises",
      },
    },
    {
      name: "filterByType",
      type: "select",
      label: "Filtrer på produkttype",
      options: [
        { label: "Alle produkter", value: "all" },
        { label: "Kun kurs", value: "course" },
        { label: "Kun PDF-er", value: "pdf" },
        { label: "Kun bundles", value: "bundle" },
      ],
      defaultValue: "all",
      admin: {
        condition: (data) => data?.selectionMode === "auto",
      },
    },
    {
      name: "limit",
      type: "number",
      label: "Maks antall produkter",
      defaultValue: 8,
      admin: {
        description: "La stå tom for å vise alle",
        condition: (data) => data?.selectionMode === "auto",
      },
    },
    {
      name: "layout",
      type: "select",
      label: "Layout",
      defaultValue: "grid",
      options: [
        { label: "Grid (3 kolonner)", value: "grid" },
        { label: "Grid (4 kolonner)", value: "grid-4" },
        { label: "Carousel", value: "carousel" },
      ],
    },
    {
      name: "showMoreLink",
      type: "checkbox",
      label: "Vis 'Se alle produkter'-lenke",
      defaultValue: false,
    },
  ],
};
