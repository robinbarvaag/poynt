import type { CollectionConfig } from "payload";
import { stockPickerAfterInput } from "../fields/stock-picker-after-input";
import { generateSlug } from "../lib/generate-slug";

/**
 * Kurs for medlemsområdet (On Poynt). I motsetning til den gamle
 * `course-content`-collectionen er disse IKKE knyttet til et produktkjøp —
 * tilgangen styres av medlemskap via `(app)`-layouten (getSessionWithMembership
 * + hasActiveAccess). Et kurs har moduler, og hver modul har leksjoner med
 * video og rik-tekst-innhold.
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
    // Ligger i den egenbygde «On Poynt»-nav-gruppen (on-poynt-nav-group.tsx),
    // ikke i Payloads standard-nav.
    group: false,
    // «Preview»-knapp i dokument-headeren → åpner kurset på nettsiden.
    preview: (doc) =>
      doc?.slug
        ? `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/on-poynt/kurs/${doc.slug}`
        : null,
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
      admin: {
        components: {
          afterInput: stockPickerAfterInput,
        },
      },
    },
    {
      name: "categories",
      type: "relationship",
      relationTo: "categories",
      hasMany: true,
      label: "Kategorier",
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
      label: "Fremhevet kurs",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description: "Vis som stort hero-kurs øverst på listesiden",
      },
    },
    {
      name: "modules",
      type: "array",
      label: "Moduler",
      labels: {
        singular: "Modul",
        plural: "Moduler",
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
          label: "Leksjoner",
          labels: {
            singular: "Leksjon",
            plural: "Leksjoner",
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
              label: "Innhold",
            },
            {
              name: "steps",
              type: "array",
              label: "Steg (steg-for-steg)",
              labels: {
                singular: "Steg",
                plural: "Steg",
              },
              admin: {
                description:
                  "For praktiske steg-for-steg-leksjoner med bilde per steg. La stå tom for en vanlig video-/tekst-leksjon.",
              },
              fields: [
                {
                  name: "title",
                  type: "text",
                  required: true,
                  label: "Stegtittel",
                },
                {
                  name: "image",
                  type: "upload",
                  relationTo: "media",
                  label: "Bilde / skjermbilde",
                },
                {
                  name: "body",
                  type: "richText",
                  label: "Forklaring",
                },
                {
                  name: "substeps",
                  type: "array",
                  label: "Delsteg",
                  labels: {
                    singular: "Delsteg",
                    plural: "Delsteg",
                  },
                  fields: [
                    {
                      name: "text",
                      type: "text",
                      required: true,
                      label: "Delsteg",
                    },
                  ],
                },
              ],
            },
            {
              name: "resources",
              type: "array",
              label: "Ressurser",
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
