import type { CollectionConfig } from "payload";

export const Orders: CollectionConfig = {
  slug: "orders",
  admin: {
    useAsTitle: "id",
  },
  access: {
    create: () => false,
    update: () => false,
    delete: () => false,
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (user.role === "admin") return true;
      return {
        user: {
          equals: user.id,
        },
      };
    },
  },
  fields: [
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      required: true,
      label: "Kunde",
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
          label: "Pris ved kjøp (øre)",
        },
      ],
    },
    {
      name: "total",
      type: "number",
      required: true,
      label: "Totalpris (øre)",
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
