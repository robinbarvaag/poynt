import type { Block } from "payload";

export const MediaBlock: Block = {
  slug: "media",
  interfaceName: "MediaBlock",
  fields: [
    {
      name: "media",
      type: "upload",
      relationTo: "media",
      required: true,
      label: "Mediafil",
    },
    {
      name: "caption",
      type: "text",
      label: "Bildetekst",
    },
  ],
};
