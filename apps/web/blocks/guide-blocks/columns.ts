import type { Block } from "payload";

/**
 * To eller flere kolonner side ved side (typisk tekst + bilde). Hver kolonne er
 * enten tekst (richText) eller et bilde med valgfri bildetekst.
 */
export const GuideColumns: Block = {
  slug: "guideColumns",
  interfaceName: "GuideColumnsBlock",
  labels: { singular: "Kolonner", plural: "Kolonner" },
  fields: [
    {
      name: "align",
      type: "select",
      label: "Vertikal justering",
      defaultValue: "top",
      options: [
        { label: "Topp", value: "top" },
        { label: "Midtstilt", value: "center" },
      ],
    },
    {
      name: "columns",
      type: "array",
      label: "Kolonner",
      labels: { singular: "Kolonne", plural: "Kolonner" },
      minRows: 1,
      fields: [
        {
          name: "type",
          type: "select",
          label: "Type",
          defaultValue: "text",
          options: [
            { label: "Tekst", value: "text" },
            { label: "Bilde", value: "image" },
          ],
        },
        {
          name: "content",
          type: "richText",
          label: "Tekst",
          admin: { condition: (_, sibling) => sibling?.type === "text" },
        },
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          label: "Bilde",
          admin: { condition: (_, sibling) => sibling?.type === "image" },
        },
        {
          name: "caption",
          type: "text",
          label: "Bildetekst",
          admin: { condition: (_, sibling) => sibling?.type === "image" },
        },
      ],
    },
  ],
};
