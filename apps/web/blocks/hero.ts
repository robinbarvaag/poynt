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
          "Vises ved siden av teksten (klippet i organisk form). Uten bilde blir heroen sentrert.",
      },
    },
    {
      name: "imageDuotone",
      type: "checkbox",
      defaultValue: false,
      label: "Fargefilter på bildet",
      admin: {
        description:
          "Legg et mykt merkefarge-filter (duotone) over bildet. Egner seg for illustrasjoner/grafikk — skru av for ekte foto av personer.",
        condition: (_, siblingData) => Boolean(siblingData?.image),
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
