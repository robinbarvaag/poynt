import type { CollectionConfig } from "payload";

export const Products: CollectionConfig = {
  slug: "products",
  admin: {
    useAsTitle: "name",
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      label: "Produktnavn",
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      label: "URL-slug",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "price",
      type: "number",
      required: true,
      label: "Pris (øre)",
      admin: {
        description: "Pris i øre (100 = 1 kr)",
      },
    },
    {
      name: "type",
      type: "select",
      required: true,
      options: [
        { label: "Kurs", value: "course" },
        { label: "PDF", value: "pdf" },
        { label: "Bundle", value: "bundle" },
      ],
      label: "Produkttype",
    },
    {
      name: "description",
      type: "richText",
      label: "Beskriving",
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      label: "Produktbilde",
    },
    {
      name: "stripePriceId",
      type: "text",
      label: "Stripe Price ID",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "stripeProductId",
      type: "text",
      label: "Stripe Product ID",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "active",
      type: "checkbox",
      defaultValue: true,
      label: "Aktiv",
      admin: {
        position: "sidebar",
      },
    },
  ],
};
