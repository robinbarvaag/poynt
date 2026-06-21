import type { CollectionConfig } from "payload";
import { generateSlug } from "../lib/generate-slug";

/**
 * Kurs for medlemsområdet (On Poynt). I motsetning til den gamle
 * `course-content`-collectionen er desse IKKJE knytte til eit produktkjøp —
 * tilgangen styrast av medlemskap via `(app)`-layouten (getSessionWithMembership
 * + hasActiveAccess). Eit kurs har modular, og kvar modul har leksjonar med
 * video og rik-tekst-innhald.
 */
export const Courses: CollectionConfig = {
  slug: "courses",
  labels: {
    singular: "Kurs",
    plural: "Kurs",
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "categories", "publishedAt", "status"],
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
        description: "Genererast automatisk frå tittel",
      },
    },
    {
      name: "excerpt",
      type: "textarea",
      label: "Utdrag",
      admin: {
        description: "Kort beskriving som visast i listeoversikter",
      },
    },
    {
      name: "featuredImage",
      type: "upload",
      relationTo: "media",
      label: "Hovudbilde",
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
      label: "Framheva kurs",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description: "Vis som stort hero-kurs øvst på listesida",
      },
    },
    {
      name: "modules",
      type: "array",
      label: "Modular",
      labels: {
        singular: "Modul",
        plural: "Modular",
      },
      fields: [
        {
          name: "title",
          type: "text",
          required: true,
          label: "Modultittel",
        },
        {
          name: "lessons",
          type: "array",
          label: "Leksjonar",
          labels: {
            singular: "Leksjon",
            plural: "Leksjonar",
          },
          fields: [
            {
              name: "title",
              type: "text",
              required: true,
              label: "Leksjonstittel",
            },
            {
              name: "videoUrl",
              type: "text",
              label: "Video-URL",
              admin: {
                description: "YouTube, Vimeo eller direkte lenke",
              },
            },
            {
              name: "content",
              type: "richText",
              label: "Innhald",
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
    },
  ],
};
