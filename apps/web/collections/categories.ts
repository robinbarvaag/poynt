import type { CollectionConfig } from "payload";
import { generateSlug } from "../lib/generate-slug";

export const Categories: CollectionConfig = {
  slug: "categories",
  labels: {
    singular: "Kategori",
    plural: "Kategorier",
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "updatedAt"],
    group: "Innhold",
  },
  hooks: {
    beforeChange: [
      async ({ data }) => {
        if (!data.slug && data.name) {
          data.slug = generateSlug(data.name);
        }
        return data;
      },
    ],
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      label: "Navn",
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      label: "URL-slug",
      admin: {
        position: "sidebar",
        description: "Genereres automatisk fra navn",
      },
    },
    {
      name: "description",
      type: "textarea",
      label: "Beskrivelse",
      admin: {
        description: "Valgfri beskrivelse av kategorien",
      },
    },
    {
      name: "color",
      type: "text",
      label: "Farge (hex)",
      admin: {
        position: "sidebar",
        description: "Hex-farge, t.d. #E1306C",
      },
    },
    {
      name: "icon",
      type: "text",
      label: "Ikon / emoji",
      admin: {
        position: "sidebar",
        description: "Emoji eller tekst som visast saman med kategorien",
      },
    },
  ],
};
