import type { Block } from "payload";

export const FeatureGrid: Block = {
  slug: "featureGrid",
  interfaceName: "FeatureGridBlock",
  labels: {
    singular: "Feature-rutenett",
    plural: "Feature-rutenett",
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
      defaultValue: "3",
      options: [
        { label: "2", value: "2" },
        { label: "3", value: "3" },
        { label: "4", value: "4" },
      ],
    },
    {
      name: "features",
      type: "array",
      label: "Kort",
      labels: { singular: "Kort", plural: "Kort" },
      minRows: 1,
      fields: [
        {
          name: "title",
          type: "text",
          required: true,
          label: "Tittel (bruk * for en aksent-stjerne, f.eks. «Lær raskere*»)",
        },
        {
          name: "text",
          type: "textarea",
          required: true,
          label: "Tekst",
        },
        {
          name: "linkLabel",
          type: "text",
          label: "Lenketekst (valgfri)",
        },
        {
          name: "linkUrl",
          type: "text",
          label: "Lenke-URL",
        },
        {
          name: "statValue",
          type: "text",
          label: "Nøkkeltall (vises hvis ingen lenke, f.eks. «12+»)",
        },
        {
          name: "statLabel",
          type: "text",
          label: "Tall-etikett (f.eks. «verktøy klare»)",
        },
      ],
    },
  ],
};
