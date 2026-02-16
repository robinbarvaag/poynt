import type { CollectionConfig } from "payload";

export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "firstName", "lastName", "role"],
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "firstName",
          type: "text",
          label: "Fornavn",
        },
        {
          name: "lastName",
          type: "text",
          label: "Etternavn",
        },
      ],
    },
    {
      name: "avatar",
      type: "upload",
      relationTo: "media",
      label: "Profilbilde",
    },
    {
      name: "bio",
      type: "textarea",
      label: "Biografi",
      admin: {
        description: "Kort beskrivelse som vises på blogginnlegg",
      },
    },
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "admin",
      options: [{ label: "Admin", value: "admin" }],
      admin: {
        position: "sidebar",
      },
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
      admin: {
        position: "sidebar",
      },
    },
  ],
};
