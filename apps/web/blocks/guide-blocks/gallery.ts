import type { Block } from "payload";

/** Rad/rutenett av flere bilder, evt. som karusell. */
export const GuideGallery: Block = {
  slug: "guideGallery",
  interfaceName: "GuideGalleryBlock",
  labels: { singular: "Galleri", plural: "Gallerier" },
  fields: [
    {
      name: "layout",
      type: "select",
      label: "Visning",
      defaultValue: "grid",
      options: [
        { label: "Rutenett", value: "grid" },
        { label: "Karusell", value: "carousel" },
      ],
    },
    {
      name: "images",
      type: "array",
      label: "Bilder",
      labels: { singular: "Bilde", plural: "Bilder" },
      minRows: 1,
      fields: [
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          label: "Bilde",
        },
        { name: "caption", type: "text", label: "Bildetekst" },
      ],
    },
    { name: "caption", type: "text", label: "Samlet bildetekst" },
  ],
};
