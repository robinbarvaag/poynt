import type { Block } from "payload";

/** Lenke-/bokmerke-kort til eksterne ressurser. */
export const GuideBookmark: Block = {
  slug: "guideBookmark",
  interfaceName: "GuideBookmarkBlock",
  labels: { singular: "Bokmerker", plural: "Bokmerker" },
  fields: [
    {
      name: "items",
      type: "array",
      label: "Lenker",
      labels: { singular: "Lenke", plural: "Lenker" },
      minRows: 1,
      fields: [
        { name: "url", type: "text", label: "URL" },
        { name: "title", type: "text", label: "Tittel" },
        { name: "description", type: "textarea", label: "Beskrivelse" },
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          label: "Forhåndsvisningsbilde",
        },
      ],
    },
  ],
};
