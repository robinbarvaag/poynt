import type { CollectionConfig } from "payload";
import { stockPickerAfterInput } from "../fields/stock-picker-after-input";
import { generateSlug } from "../lib/generate-slug";
import {
  revalidateCmsAfterChange,
  revalidateCmsAfterDelete,
} from "../lib/revalidate-cms";

/**
 * Kurs for medlemsområdet (On Poynt). I motsetning til den gamle
 * `course-content`-collectionen er disse IKKE knyttet til et produktkjøp —
 * tilgangen styres av medlemskap via `(app)`-layouten (getSessionWithMembership
 * + hasActiveAccess). Et kurs har moduler, og hver modul har leksjoner med
 * video og rik-tekst-innhold.
 *
 * Hovedkolonnen er delt i faner (samme mønster som Guider): «Innhold» er
 * selve kurset, «Hjelp og kvalitet» samler skrivehjelpen utenfor
 * skriveflyten. Kursene ligger bak innlogging, så det finnes ingen SEO-fane.
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
    afterChange: [revalidateCmsAfterChange],
    afterDelete: [revalidateCmsAfterDelete],
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Innhold",
          description: "Selve kurset — moduler med leksjoner.",
          fields: [
            {
              name: "title",
              type: "text",
              required: true,
              label: "Tittel",
            },
            {
              name: "excerpt",
              type: "textarea",
              label: "Utdrag",
              admin: {
                description:
                  "Én–to setninger om hvem kurset er for og hva de sitter igjen med. Vises i kursoversikten.",
              },
            },
            {
              name: "featuredImage",
              type: "upload",
              relationTo: "media",
              label: "Hovedbilde",
              admin: {
                description: "Vises i kursoversikten og øverst på kurssiden",
                components: {
                  afterInput: stockPickerAfterInput,
                },
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
              admin: {
                description:
                  "Del kurset i moduler med et tydelig tema hver. Hver modul har sine egne leksjoner.",
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
                  admin: {
                    description:
                      "Korte leksjoner slår lange — heller ti på fem minutter enn tre på tjue.",
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
                      label: "Video-lenke",
                      admin: {
                        description:
                          "Lim inn lenken til videoen (YouTube, Vimeo eller direkte lenke)",
                      },
                    },
                    {
                      name: "content",
                      type: "richText",
                      label: "Innhold",
                      admin: {
                        description:
                          "Teksten som vises under videoen — eller hele leksjonen hvis den ikke har video",
                      },
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
                        initCollapsed: true,
                        description:
                          "Bruk steg med skjermbilder der medlemmet skal GJØRE noe selv. La stå tom for en vanlig video-/tekst-leksjon.",
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
                      admin: {
                        initCollapsed: true,
                        description:
                          "Maler og filer medlemmet kan laste ned fra leksjonen",
                      },
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
        },
        {
          label: "Hjelp og kvalitet",
          description:
            "Tips og sjekklister som hjelper deg mens du bygger kurset. Ingenting her vises for medlemmene.",
          fields: [
            {
              // Visuell skrivehjelp: hvem/moduler/praktisk + live sjekkliste.
              name: "retningslinjer",
              type: "ui",
              admin: {
                components: {
                  Field:
                    "/admin/components/content-guidelines#ContentGuidelines",
                },
              },
            },
          ],
        },
      ],
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
        description: "Vis som stort hero-kurs øverst i kursoversikten",
      },
    },
  ],
};
