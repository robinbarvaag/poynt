import type { Block } from "payload";

export const Hero: Block = {
  slug: "hero",
  interfaceName: "HeroBlock",
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      label: "Tittel",
    },
    {
      name: "subtitle",
      type: "textarea",
      label: "Undertekst",
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      label: "Bilde",
    },
    {
      name: "cta",
      type: "group",
      label: "Call to Action",
      fields: [
        {
          name: "text",
          type: "text",
          label: "Knappetekst",
        },
        {
          name: "url",
          type: "text",
          label: "Lenke",
        },
      ],
    },
  ],
};
