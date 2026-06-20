import type { Block } from "payload";

export const PathCards: Block = {
  slug: "pathCards",
  interfaceName: "PathCardsBlock",
  labels: {
    singular: "Veivalg («to dører»)",
    plural: "Veivalg-seksjoner",
  },
  fields: [
    {
      name: "eyebrow",
      type: "text",
      label: "Etikett (liten tekst over tittel)",
    },
    {
      name: "title",
      type: "text",
      label: "Tittel",
    },
    {
      name: "intro",
      type: "textarea",
      label: "Ingress",
    },
    {
      name: "columns",
      type: "select",
      label: "Antall kolonner",
      defaultValue: "2",
      options: [
        { label: "2 (to dører)", value: "2" },
        { label: "3 (tre veier)", value: "3" },
      ],
    },
    {
      name: "paths",
      type: "array",
      label: "Kort",
      labels: { singular: "Kort", plural: "Kort" },
      minRows: 2,
      maxRows: 3,
      fields: [
        {
          name: "eyebrow",
          type: "text",
          label: "Etikett (f.eks. «For deg som»)",
        },
        {
          name: "title",
          type: "text",
          required: true,
          label: "Tittel (f.eks. «Jeg er gründer»)",
        },
        {
          name: "description",
          type: "textarea",
          label: "Beskrivelse",
        },
        {
          name: "href",
          type: "text",
          required: true,
          label: "Lenke (f.eks. /for-grundere)",
        },
        {
          name: "ctaLabel",
          type: "text",
          label: "Handlingstekst",
          defaultValue: "Utforsk",
        },
        {
          name: "items",
          type: "array",
          label: "Punkter",
          labels: { singular: "Punkt", plural: "Punkter" },
          fields: [
            {
              name: "text",
              type: "text",
              required: true,
              label: "Tekst",
            },
          ],
        },
        {
          name: "surface",
          type: "select",
          label: "Farge",
          admin: {
            description:
              "La stå tom for automatisk fargerotasjon (saffron/mint/salmon).",
          },
          options: [
            { label: "Lys (default)", value: "default" },
            { label: "Saffron (gul)", value: "saffron" },
            { label: "Salmon (rosa)", value: "salmon" },
            { label: "Mint (grønn)", value: "mint" },
            { label: "Primær (mørk grønn)", value: "primary" },
          ],
        },
      ],
    },
  ],
};
