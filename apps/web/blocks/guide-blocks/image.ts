import type { Block } from "payload";
import { sectionHeaderFields } from "./_shared";

/** Enkeltstående bilde med valgfri bildetekst og bredde. */
export const GuideImage: Block = {
  slug: "guideImage",
  interfaceName: "GuideImageBlock",
  labels: { singular: "Bilde", plural: "Bilder" },
  fields: [
    ...sectionHeaderFields,
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
    {
      name: "align",
      type: "select",
      label: "Justering",
      defaultValue: "center",
      admin: {
        description:
          "Gjelder for normal bredde (bred/full fyller alltid bredden)",
      },
      options: [
        { label: "Sentrert", value: "center" },
        { label: "Venstre", value: "left" },
        { label: "Høyre", value: "right" },
      ],
    },
  ],
};
