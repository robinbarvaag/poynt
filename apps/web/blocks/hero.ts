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
      defaultValue: "standard",
      options: [
        { label: "Standard", value: "standard" },
        {
          label: "Showcase (fargebakgrunn + bilde under)",
          value: "fullscreen",
        },
      ],
      label: "Variant",
      admin: {
        description:
          "Standard: Sentrert uten bilde, eller tekst + bilde side om side. Fullskjerm: Bilde som bakgrunn med overlay.",
      },
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
      name: "tagsLabel",
      type: "text",
      label: "Tags overskrift",
      admin: {
        description: "F.eks. 'Jeg tilbyr:' eller 'Tjenester:'",
      },
    },
    {
      name: "tags",
      type: "array",
      label: "Tags",
      admin: {
        description: "Vises som horisontale badges/tags",
      },
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
          label: "Tag",
        },
      ],
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      label: "Bilde",
      admin: {
        description:
          "Standard: Vises ved siden av teksten. Fullskjerm: Brukes som bakgrunnsbilde.",
      },
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
