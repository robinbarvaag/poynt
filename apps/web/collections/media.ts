import type { CollectionConfig } from "payload";

export const Media: CollectionConfig = {
  slug: "media",
  admin: {
    group: "Innhold",
  },
  access: {
    read: ({ req: { user } }) => {
      // Innloggede brukere kan se alt
      if (user) return true;
      // Anonyme brukere kan bare se public bilder
      return {
        isPrivate: {
          not_equals: true,
        },
      };
    },
  },
  upload: {
    focalPoint: true,
    imageSizes: [
      {
        name: "thumbnail",
        width: 400,
        height: 300,
        position: "centre",
      },
      {
        name: "card",
        width: 768,
        height: 1024,
        position: "centre",
      },
      {
        name: "tablet",
        width: 1024,
        height: undefined,
        position: "centre",
      },
    ],
    adminThumbnail: "thumbnail",
    mimeTypes: ["image/*", "application/pdf"],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      label: "Alt-tekst",
    },
    {
      name: "isPrivate",
      type: "checkbox",
      label: "Privat bilde",
      defaultValue: false,
      admin: {
        description: "Kun synlig for innloggede brukere",
        position: "sidebar",
      },
    },
  ],
};
