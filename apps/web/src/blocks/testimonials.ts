import type { Block } from "payload";

export const Testimonials: Block = {
  slug: "testimonials",
  interfaceName: "TestimonialsBlock",
  labels: {
    singular: "Anmeldelser-seksjon",
    plural: "Anmeldelser-seksjoner",
  },
  fields: [
    {
      name: "title",
      type: "text",
      label: "Tittel",
    },
    {
      name: "layout",
      type: "select",
      defaultValue: "cards",
      options: [
        { label: "Kort", value: "cards" },
        { label: "Slider", value: "slider" },
        { label: "Stor sitat", value: "quote" },
      ],
      label: "Layout",
    },
    {
      name: "testimonials",
      type: "array",
      label: "Anmeldelser",
      minRows: 1,
      maxRows: 12,
      fields: [
        {
          name: "quote",
          type: "textarea",
          required: true,
          label: "Sitat",
        },
        {
          name: "author",
          type: "text",
          required: true,
          label: "Navn",
        },
        {
          name: "role",
          type: "text",
          label: "Rolle/Tittel",
        },
        {
          name: "company",
          type: "text",
          label: "Selskap",
        },
        {
          name: "avatar",
          type: "upload",
          relationTo: "media",
          label: "Bilde",
        },
        {
          name: "rating",
          type: "number",
          min: 1,
          max: 5,
          label: "Vurdering (1-5)",
        },
      ],
    },
  ],
};
