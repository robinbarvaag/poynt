import type { Block } from "payload";

export const CtaSection: Block = {
  slug: "ctaSection",
  interfaceName: "CtaSectionBlock",
  labels: {
    singular: "CTA-seksjon",
    plural: "CTA-seksjoner",
  },
  fields: [
    {
      name: "variant",
      type: "select",
      defaultValue: "simple",
      options: [
        { label: "Enkel", value: "simple" },
        { label: "Med bakgrunnsfarge", value: "colored" },
        { label: "Med bakgrunnsbilde", value: "image" },
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
      name: "description",
      type: "textarea",
      label: "Beskrivelse",
    },
    {
      name: "backgroundImage",
      type: "upload",
      relationTo: "media",
      label: "Bakgrunnsbilde",
      admin: {
        condition: (data, siblingData) => siblingData?.variant === "image",
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
          required: true,
          label: "Knappetekst",
        },
        {
          name: "url",
          type: "text",
          required: true,
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
