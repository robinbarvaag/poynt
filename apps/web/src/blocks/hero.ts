import { lexicalEditor } from "@payloadcms/richtext-lexical";
import type { Block } from "payload";

export const Hero: Block = {
  slug: "hero",
  interfaceName: "HeroBlock",
  labels: {
    singular: "Hero-seksjon",
    plural: "Hero-seksjoner",
  },
  fields: [
    {
      name: "variant",
      type: "select",
      defaultValue: "centered",
      options: [
        { label: "Sentrert", value: "centered" },
        { label: "Venstre-justert", value: "left" },
        { label: "Med bilde til høyre", value: "split" },
        { label: "Fullskjerm med bakgrunnsbilde", value: "fullscreen" },
      ],
      label: "Variant",
    },
    {
      name: "title",
      type: "text",
      required: true,
      label: "Tittel",
    },
    {
      name: "subtitle",
      type: "richText",
      label: "Undertekst",
      editor: lexicalEditor({}),
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      label: "Bilde",
    },
    {
      name: "primaryCta",
      type: "group",
      label: "Primær CTA",
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
    {
      name: "secondaryCta",
      type: "group",
      label: "Sekundær CTA",
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
