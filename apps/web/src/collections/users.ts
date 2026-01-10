import type { CollectionConfig } from "payload";

export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: {
    useAsTitle: "email",
  },
  fields: [
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "customer",
      options: [
        { label: "Admin", value: "admin" },
        { label: "Kunde", value: "customer" },
      ],
    },
    {
      name: "stripeCustomerId",
      type: "text",
      admin: {
        position: "sidebar",
        readOnly: true,
      },
      label: "Stripe Customer ID",
    },
    {
      name: "purchases",
      type: "relationship",
      relationTo: "orders",
      hasMany: true,
      label: "Kjøp",
    },
  ],
};
