import type { CollectionConfig } from "payload";
import {
  qualityDataFields,
  qualityReviewPanel,
} from "../fields/quality-review";
import { seoFaqField } from "../fields/seo-meta";
import { stockPickerAfterInput } from "../fields/stock-picker-after-input";
import { generateSlug } from "../lib/generate-slug";
import {
  revalidateCmsAfterChange,
  revalidateCmsAfterDelete,
} from "../lib/revalidate-cms";

export const Services: CollectionConfig = {
  slug: "services",
  labels: {
    singular: "Tjeneste",
    plural: "Tjenester",
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "priceType", "qualityScore", "updatedAt"],
    group: "Innhold",
    // Live preview + «Preview»-knapp går via /api/preview (draft mode) slik at
    // redaktøren ser siste autosave på /forhandsvisning, ikke den statiske,
    // cachede sida.
    livePreview: {
      url: ({ data }) => {
        const base = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
        return `${base}/api/preview?path=${encodeURIComponent(`/tjenester/${data?.slug}`)}`;
      },
    },
    preview: (doc) => {
      const base = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
      if (!doc?.slug) return null;
      return `${base}/api/preview?path=${encodeURIComponent(`/tjenester/${doc.slug}`)}`;
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
        if (!data.slug && data.name) {
          data.slug = generateSlug(data.name);
        }
        return data;
      },
    ],
    afterChange: [revalidateCmsAfterChange],
    afterDelete: [revalidateCmsAfterDelete],
  },
  fields: [
    {
      // Hovedkolonnen i faner (samme mønster som Guider): «Innhold» er selve
      // tjenesten, «Hjelp og kvalitet» samler skrivehjelp og AI-vurdering
      // utenfor skriveflyten. seoPlugin (tabbedUI) legger «SEO»-fanen til på
      // slutten fordi tabs-feltet står først i fields.
      type: "tabs",
      tabs: [
        {
          label: "Innhold",
          description: "Selve tjenesten.",
          fields: [
            {
              name: "name",
              type: "text",
              required: true,
              label: "Tjenestenavn",
            },
            {
              name: "shortDescription",
              type: "textarea",
              required: true,
              label: "Kort beskrivelse",
              admin: {
                description:
                  "Én–to setninger, helst uten linjeskift — vises i oversikten på forsiden. Si hva kunden får, ikke hva vi gjør. Lengre tekst med avsnitt hører hjemme i Detaljert beskrivelse.",
              },
            },
            {
              name: "image",
              type: "upload",
              relationTo: "media",
              label: "Bilde",
              admin: {
                description: "Vises i tjenesteoversikten",
                components: {
                  afterInput: stockPickerAfterInput,
                },
              },
            },
            {
              name: "content",
              type: "richText",
              label: "Detaljert beskrivelse",
              admin: {
                description:
                  "Valgfritt - vises på tjenestesiden. Fortell hva som er inkludert, hvordan det foregår og hva kunden sitter igjen med.",
              },
            },
            {
              name: "priceType",
              type: "select",
              required: true,
              defaultValue: "fixed",
              label: "Pristype",
              options: [
                { label: "Fast pris", value: "fixed" },
                { label: "Fra-pris", value: "from" },
                { label: "Per måned", value: "monthly" },
                { label: "Ta kontakt for pris", value: "contact" },
              ],
            },
            {
              name: "price",
              type: "number",
              label: "Pris (kr)",
              admin: {
                description: "Pris i hele kroner (eks. mva)",
                condition: (data) => data.priceType !== "contact",
              },
            },
            {
              name: "includesVat",
              type: "checkbox",
              label: "Vis '+ mva' etter pris",
              defaultValue: true,
              admin: {
                condition: (data) => data.priceType !== "contact",
              },
            },
            // FAQ hører innholdsmessig til SEO, men SEO-fanen eies av
            // pluginen — så den ligger nederst her.
            seoFaqField(),
          ],
        },
        {
          label: "Hjelp og kvalitet",
          description:
            "Tips og sjekklister som hjelper deg mens du skriver. Ingenting her vises på nettsiden.",
          fields: [
            {
              // Visuell skrivehjelp: hva/pris/neste steg + live sjekkliste.
              // Tjenestesjekken under tar seg av de deterministiske
              // tekst-reglene.
              name: "retningslinjer",
              type: "ui",
              admin: {
                components: {
                  Field:
                    "/admin/components/content-guidelines#ContentGuidelines",
                },
              },
            },
            {
              name: "tjenestesjekk",
              type: "ui",
              admin: {
                components: {
                  Field: "/admin/components/text-check#TextCheck",
                },
              },
            },
            qualityReviewPanel(),
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
        description: "Genereres automatisk fra navn",
      },
    },
    {
      name: "ctaText",
      type: "text",
      label: "Knappetekst",
      defaultValue: "Les mer",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "ctaLink",
      type: "text",
      label: "Knapp-lenke",
      admin: {
        position: "sidebar",
        description: "Valgfritt - overstyr standard lenke til tjenestesiden",
      },
    },
    {
      name: "sortOrder",
      type: "number",
      label: "Sorteringsrekkefølge",
      defaultValue: 0,
      admin: {
        position: "sidebar",
        description: "Lavere tall vises først",
      },
    },
    {
      name: "featured",
      type: "checkbox",
      label: "Fremhev (stort kort)",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description:
          "Vises som et bredt kort over 2 kolonner på tjenestesiden. Bruk på én tjeneste.",
      },
    },
    {
      name: "active",
      type: "checkbox",
      label: "Aktiv",
      defaultValue: true,
      admin: {
        position: "sidebar",
        description: "Deaktiver for å skjule tjenesten",
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
    ...qualityDataFields({ sidebarSection: true }),
  ],
};
