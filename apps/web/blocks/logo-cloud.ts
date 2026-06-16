import type { Block } from "payload";

export const LogoCloud: Block = {
  slug: "logoCloud",
  interfaceName: "LogoCloudBlock",
  labels: { singular: "Logo-stripe", plural: "Logo-striper" },
  fields: [
    {
      name: "label",
      type: "text",
      label: "Ledetekst (f.eks. «Brukt av folk fra»)",
    },
    {
      name: "logos",
      type: "array",
      label: "Logoer",
      labels: { singular: "Logo", plural: "Logoer" },
      minRows: 1,
      fields: [
        {
          name: "name",
          type: "text",
          required: true,
          label: "Navn (vises som tekst uten bilde)",
        },
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          label: "Bilde (valgfri)",
        },
      ],
    },
  ],
};
