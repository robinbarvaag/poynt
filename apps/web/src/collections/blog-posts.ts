import type { CollectionConfig } from "payload";

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[æ]/g, "ae")
    .replace(/[ø]/g, "o")
    .replace(/[å]/g, "a")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const BlogPosts: CollectionConfig = {
  slug: "blog-posts",
  labels: {
    singular: "Blogginnlegg",
    plural: "Blogginnlegg",
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "author", "publishedAt", "status"],
    group: "Innhold",
    livePreview: {
      url: ({ data }) => {
        return `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/post/${data?.slug}`;
      },
    },
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
        description: "Kort beskrivelse som vises i listeoversikter og SEO",
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
      type: "array",
      label: "Kategorier",
      admin: {
        position: "sidebar",
      },
      fields: [
        {
          name: "category",
          type: "select",
          options: [
            { label: "Instagram", value: "instagram" },
            { label: "LinkedIn", value: "linkedin" },
            { label: "Pinterest", value: "pinterest" },
            { label: "Markedsføring", value: "markedsforing" },
            { label: "Sosiale medier", value: "sosiale-medier" },
            { label: "Tips & triks", value: "tips" },
          ],
        },
      ],
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
      name: "relatedPosts",
      type: "relationship",
      relationTo: "blog-posts",
      hasMany: true,
      label: "Relaterte innlegg",
      admin: {
        position: "sidebar",
      },
    },
  ],
};
