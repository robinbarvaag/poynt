import type { CollectionConfig } from "payload";

export const Orders: CollectionConfig = {
  slug: "orders",
  admin: {
    useAsTitle: "customerEmail",
  },
  access: {
    create: () => false,
    update: () => false,
    delete: () => false,
    read: ({ req: { user } }) => !!user,
  },
  fields: [
    {
      name: "customerEmail",
      type: "email",
      required: true,
      label: "Kunde e-post",
    },
    {
      name: "customerName",
      type: "text",
      label: "Kundenamn",
    },
    {
      name: "items",
      type: "array",
      required: true,
      label: "Produkter",
      fields: [
        {
          name: "product",
          type: "relationship",
          relationTo: "products",
          required: true,
          label: "Produkt",
        },
        {
          name: "priceAtPurchase",
          type: "number",
          required: true,
          label: "Pris ved kjøp (kr)",
        },
      ],
    },
    {
      name: "total",
      type: "number",
      required: true,
      label: "Totalpris (kr)",
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "pending",
      options: [
        { label: "Avventer", value: "pending" },
        { label: "Betalt", value: "paid" },
        { label: "Avbrutt", value: "cancelled" },
      ],
      label: "Status",
    },
    {
      name: "stripeSessionId",
      type: "text",
      label: "Stripe Session ID",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "stripePaymentIntentId",
      type: "text",
      label: "Stripe Payment Intent ID",
      admin: {
        position: "sidebar",
      },
    },
  ],
};
