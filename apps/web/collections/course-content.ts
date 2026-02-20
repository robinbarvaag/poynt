import type { CollectionConfig } from "payload";

export const CourseContent: CollectionConfig = {
  slug: "course-content",
  admin: {
    useAsTitle: "title",
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      label: "Kurstittel",
    },
    {
      name: "product",
      type: "relationship",
      relationTo: "products",
      required: true,
      label: "Tilhørende produkt",
      admin: {
        description: "Kun brukarar som har kjøpt dette produktet får tilgang",
      },
    },
    {
      name: "modules",
      type: "array",
      label: "Modular",
      fields: [
        {
          name: "title",
          type: "text",
          required: true,
          label: "Modultittel",
        },
        {
          name: "videoUrl",
          type: "text",
          label: "Video URL",
          admin: {
            description: "YouTube, Vimeo eller direkte lenke",
          },
        },
        {
          name: "resources",
          type: "array",
          label: "Ressursar",
          fields: [
            {
              name: "title",
              type: "text",
              required: true,
              label: "Tittel",
            },
            {
              name: "file",
              type: "upload",
              relationTo: "media",
              label: "Fil",
            },
          ],
        },
      ],
    },
  ],
};
