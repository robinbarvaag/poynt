import type { Block } from "payload";

/** Enkeltstående bilde med valgfri bildetekst og bredde. */
export const GuideImage: Block = {
  slug: "guideImage",
  interfaceName: "GuideImageBlock",
  labels: { singular: "Bilde", plural: "Bilder" },
  fields: [
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      label: "Bilde",
    },
    { name: "caption", type: "text", label: "Bildetekst" },
    {
      name: "width",
      type: "select",
      label: "Bredde",
      defaultValue: "normal",
      options: [
        { label: "Normal", value: "normal" },
        { label: "Bred", value: "wide" },
        { label: "Full", value: "full" },
      ],
    },
  ],
};
