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
      name: "selectionMode",
      type: "select",
      label: "Velg tjenester",
      defaultValue: "auto",
      options: [
        { label: "Automatisk (alle aktive)", value: "auto" },
        { label: "Manuelt utvalg", value: "manual" },
      ],
    },
    {
      name: "selectedServices",
      type: "relationship",
      relationTo: "services",
      hasMany: true,
      label: "Velg tjenester",
      admin: {
        condition: (data) => data?.selectionMode === "manual",
        description: "Velg hvilke tjenester som skal vises, i ønsket rekkefølge",
      },
    },
    {
      name: "limit",
      type: "number",
      label: "Maks antall tjenester",
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
