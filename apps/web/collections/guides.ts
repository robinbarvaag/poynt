import type { CollectionConfig } from "payload";
import { guideBlocks } from "../blocks/guide-blocks";
import {
  qualityDataFields,
  qualityReviewPanel,
} from "../fields/quality-review";
import { stockPickerAfterInput } from "../fields/stock-picker-after-input";
import { enrichBookmarks } from "../lib/enrich-bookmarks";
import { generateSlug } from "../lib/generate-slug";
import {
  revalidateCmsAfterChange,
  revalidateCmsAfterDelete,
} from "../lib/revalidate-cms";

/**
 * Guider = On-Poynt sitt ressursbibliotek (tidligere i Notion). Blokk-basert
 * innhold som rendres med leken motion på `/on-poynt/ressurser`. `section`
 * styrer grupperingen på hub-en (speiler Notion-forsidens seksjoner).
 *
 * Hovedkolonnen er delt i faner: «Innhold» (selve guiden) og «Hjelp og
 * kvalitet» (skrivehjelp + AI-vurdering), så hjelpeverktøyene ikke ligger
 * midt i skriveflyten.
 */
export const Guides: CollectionConfig = {
  slug: "guides",
  labels: {
    singular: "Guide",
    plural: "Guider",
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: [
      "title",
      "section",
      "category",
      "qualityScore",
      "order",
      "status",
    ],
    // Ligger i den egenbygde «On Poynt»-nav-gruppen (on-poynt-nav-group.tsx),
    // ikke i Payloads standard-nav.
    group: false,
    // «Preview»-knapp i dokument-headeren → åpner guiden på nettsiden.
    // Motsatt vei av den egenbygde <AdminBar> ute på frontend.
    preview: (doc) =>
      doc?.slug
        ? `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/on-poynt/ressurser/${doc.slug}`
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
      enrichBookmarks,
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
          description: "Selve guiden.",
          fields: [
            {
              name: "title",
              type: "text",
              required: true,
              label: "Tittel",
            },
            {
              name: "coverImage",
              type: "upload",
              relationTo: "media",
              label: "Cover-bilde",
              admin: {
                description: "Full-bredde banner øverst på guiden",
                components: {
                  afterInput: stockPickerAfterInput,
                },
              },
            },
            {
              name: "lede",
              type: "textarea",
              label: "Ingress",
              admin: {
                description:
                  "Kort introduksjon som vises i hero og i listevisning",
              },
            },
            {
              name: "content",
              type: "blocks",
              label: "Innhold",
              blocks: guideBlocks,
            },
          ],
        },
        {
          label: "Hjelp og kvalitet",
          description:
            "Tips og sjekklister som hjelper deg mens du skriver. Ingenting her vises for medlemmene.",
          fields: [
            {
              // Visuell skrivehjelp: hvem/steg/neste + live sjekkliste.
              name: "retningslinjer",
              type: "ui",
              admin: {
                components: {
                  Field:
                    "/admin/components/content-guidelines#ContentGuidelines",
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
        description: "Genereres automatisk fra tittel",
      },
    },
    {
      name: "icon",
      type: "text",
      label: "Emoji-ikon",
      admin: {
        position: "sidebar",
        description: "Vises ved tittelen, f.eks. 📸 eller ✨",
      },
    },
    {
      // Sidebar-ro: plasseringsvalgene samlet i én sammenleggbar seksjon
      // (kun presentasjon — feltnavn og DB-skjema er uendret).
      type: "collapsible",
      label: "Plassering",
      admin: {
        position: "sidebar",
        initCollapsed: false,
      },
      fields: [
        {
          name: "section",
          type: "select",
          required: true,
          label: "Seksjon",
          defaultValue: "generelt",
          admin: {
            description: "Styrer hvor guiden grupperes på ressurs-forsiden",
          },
          options: [
            { label: "Generelt", value: "generelt" },
            { label: "Kanaler", value: "kanaler" },
            { label: "Maler", value: "maler" },
            { label: "Inspirasjon", value: "inspirasjon" },
            { label: "Gratis ressurser", value: "ressurser" },
          ],
        },
        {
          name: "category",
          type: "relationship",
          relationTo: "categories",
          label: "Kategori / kanal",
          admin: {
            description: "Gir farge og ikon-identitet (f.eks. Instagram)",
          },
        },
        {
          name: "order",
          type: "number",
          label: "Rekkefølge",
          defaultValue: 0,
          admin: {
            description: "Lavere tall vises først innenfor seksjonen",
          },
        },
        {
          name: "isFeatured",
          type: "checkbox",
          label: "Framhevet",
          defaultValue: false,
        },
      ],
    },
    {
      type: "collapsible",
      label: "Visning",
      admin: {
        position: "sidebar",
        initCollapsed: true,
      },
      fields: [
        {
          name: "showToc",
          type: "checkbox",
          label: "Vis innholdsmeny",
          defaultValue: true,
          admin: {
            description:
              "Viser en seksjonsmeny (innholdsfortegnelse) ved siden av guiden når den har minst to H2-overskrifter. Skru av for å skjule den.",
          },
        },
        {
          name: "relatedGuides",
          type: "relationship",
          relationTo: "guides",
          hasMany: true,
          label: "Relaterte guider",
        },
      ],
    },
    ...qualityDataFields({ sidebarSection: true }),
  ],
};
