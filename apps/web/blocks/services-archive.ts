import type { Block } from "payload";

export const ServicesArchive: Block = {
  slug: "servicesArchive",
  interfaceName: "ServicesArchiveBlock",
  labels: {
    singular: "Tjenester-seksjon",
    plural: "Tjenester-seksjoner",
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
      name: "layout",
      type: "select",
      label: "Layout",
      defaultValue: "grid",
      options: [
        { label: "Grid (2-4 kolonner)", value: "grid" },
        { label: "Liste", value: "list" },
      ],
    },
    {
      name: "showMoreLink",
      type: "checkbox",
      label: "Vis 'Se alle'-lenke",
      defaultValue: false,
    },
  ],
};
