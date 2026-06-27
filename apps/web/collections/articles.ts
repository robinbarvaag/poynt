import type { CollectionConfig } from "payload";
import { generateSlug } from "../lib/generate-slug";

export const Articles: CollectionConfig = {
  slug: "articles",
  labels: {
    singular: "Artikkel",
    plural: "Artikler",
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "author", "categories", "publishedAt", "status"],
    group: "Innhold",
  },
  versions: {
    drafts: {
      autosave: true,
    },
  },
  hooks: {
    beforeChange: [
      async ({ data }) => {
        if (!data.slug && data.title) {
          data.slug = generateSlug(data.title);
        }
        return data;
      },
    ],
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      label: "Tittel",
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
        description: "Genereres automatisk fra tittel",
      },
    },
    {
      name: "excerpt",
      type: "textarea",
      label: "Utdrag",
      admin: {
        description: "Kort beskrivelse som vises i listeoversikter",
      },
    },
    {
      name: "featuredImage",
      type: "upload",
      relationTo: "media",
      label: "Hovedbilde",
    },
    {
      name: "content",
      type: "richText",
      required: true,
      label: "Innhold",
    },
    {
      name: "author",
      type: "relationship",
      relationTo: "users",
      label: "Forfatter",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "categories",
      type: "relationship",
      relationTo: "categories",
      hasMany: true,
      label: "Kategoriar",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "publishedAt",
      type: "date",
      required: true,
      label: "Publiseringsdato",
      admin: {
        position: "sidebar",
        date: {
          pickerAppearance: "dayAndTime",
        },
      },
    },
    {
      name: "isFeatured",
      type: "checkbox",
      label: "Framheva artikkel",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description: "Vis som stor hero-artikkel øvst på listesida",
      },
    },
    {
      name: "readingTime",
      type: "number",
      label: "Lesetid (minutt)",
      admin: {
        position: "sidebar",
        description: "Estimert lesetid i minutt",
      },
    },
    {
      name: "relatedArticles",
      type: "relationship",
      relationTo: "articles",
      hasMany: true,
      label: "Relaterte artikler",
      admin: {
        position: "sidebar",
      },
    },
  ],
};
