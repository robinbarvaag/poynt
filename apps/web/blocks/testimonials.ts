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
      name: "eyebrow",
      type: "text",
      label: "Etikett (liten tekst over tittel)",
    },
    {
      name: "title",
      type: "text",
      label: "Tittel",
    },
    {
      name: "intro",
      type: "textarea",
      label: "Ingress",
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
          name: "logo",
          type: "upload",
          relationTo: "media",
          label: "Kundelogo",
          admin: {
            description: "Firmalogo som vises over sitatet",
          },
        },
        {
          name: "avatar",
          type: "upload",
          relationTo: "media",
          label: "Personbilde",
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
    {
      // Presentasjonsvalg samlet nederst (kun visning — samme feltnavn/skjema).
      type: "collapsible",
      label: "Utseende",
      admin: { initCollapsed: true },
      fields: [
        {
          name: "layout",
          type: "select",
          defaultValue: "cards",
          options: [
            { label: "Kort", value: "cards" },
            { label: "Stor sitat", value: "quote" },
          ],
          label: "Layout",
        },
        {
          name: "columns",
          type: "select",
          label: "Antall kolonner",
          defaultValue: "3",
          admin: {
            condition: (_, siblingData) => siblingData?.layout !== "quote",
          },
          options: [
            { label: "2", value: "2" },
            { label: "3", value: "3" },
          ],
        },
      ],
    },
  ],
};
