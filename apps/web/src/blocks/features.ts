import type { Block } from "payload";

export const Features: Block = {
  slug: "features",
  interfaceName: "FeaturesBlock",
  labels: {
    singular: "Features-seksjon",
    plural: "Features-seksjoner",
  },
  fields: [
    {
      name: "eyebrow",
      type: "text",
      label: "Eyebrow-tekst",
      admin: {
        description: "Liten tekst over tittelen, f.eks. 'Hvorfor velge oss'",
      },
    },
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
      name: "layout",
      type: "select",
      defaultValue: "grid-3",
      options: [
        { label: "3 kolonner", value: "grid-3" },
        { label: "2 kolonner", value: "grid-2" },
        { label: "4 kolonner", value: "grid-4" },
        { label: "Liste", value: "list" },
      ],
      label: "Layout",
    },
    {
      name: "features",
      type: "array",
      label: "Features",
      minRows: 1,
      maxRows: 12,
      fields: [
        {
          name: "icon",
          type: "select",
          options: [
            { label: "Bok", value: "book" },
            { label: "Video", value: "video" },
            { label: "Sjekk", value: "check" },
            { label: "Stjerne", value: "star" },
            { label: "Rakett", value: "rocket" },
            { label: "Skjold", value: "shield" },
            { label: "Hjerte", value: "heart" },
            { label: "Melding", value: "message" },
            { label: "Graf", value: "chart" },
            { label: "Klokke", value: "clock" },
          ],
          label: "Ikon",
        },
        {
          name: "title",
          type: "text",
          required: true,
          label: "Tittel",
        },
        {
          name: "description",
          type: "textarea",
          label: "Beskrivelse",
        },
      ],
    },
  ],
};
