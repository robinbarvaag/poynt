import type { CollectionConfig } from "payload";

export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "firstName", "lastName"],
    hidden: true,
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
  ],
};
