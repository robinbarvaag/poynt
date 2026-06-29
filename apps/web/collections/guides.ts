import type { CollectionConfig } from "payload";
import { guideBlocks } from "../blocks/guide-blocks";
import { stockPickerAfterInput } from "../fields/stock-picker-after-input";
import { enrichBookmarks } from "../lib/enrich-bookmarks";
import { generateSlug } from "../lib/generate-slug";

/**
 * Guider = On-Poynt sitt ressursbibliotek (tidligere i Notion). Blokk-basert
 * innhold som rendres med leken motion på `/on-poynt/ressurser`. `section`
 * styrer grupperingen på hub-en (speiler Notion-forsidens seksjoner).
 *
 * Hovedkolonnen er delt i faner: «Innhold» (selve guiden) og «Kvalitet»
 * (AI-vurderingen), så kvalitetsverktøyet ikke ligger midt i skriveflyten.
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
    group: "Innhold",
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
          label: "Kvalitet",
          description:
            "AI-vurdering av nytteverdi. Påvirker ikke det publiserte innholdet — kun et redaksjonelt hjelpemiddel.",
          fields: [
            {
              name: "kvalitetsvurdering",
              type: "ui",
              label: "Kvalitetsvurdering",
              admin: {
                components: {
                  Field:
                    "/admin/components/guides/review-guide-button#ReviewGuideButton",
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
      name: "icon",
      type: "text",
      label: "Emoji-ikon",
      admin: {
        position: "sidebar",
        description: "Vises ved tittelen, f.eks. 📸 eller ✨",
      },
    },
    {
      name: "section",
      type: "select",
      required: true,
      label: "Seksjon",
      defaultValue: "generelt",
      admin: {
        position: "sidebar",
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
        position: "sidebar",
        description: "Gir farge og ikon-identitet (f.eks. Instagram)",
      },
    },
    {
      name: "order",
      type: "number",
      label: "Rekkefølge",
      defaultValue: 0,
      admin: {
        position: "sidebar",
        description: "Lavere tall vises først innenfor seksjonen",
      },
    },
    {
      name: "isFeatured",
      type: "checkbox",
      label: "Framhevet",
      defaultValue: false,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "showToc",
      type: "checkbox",
      label: "Vis innholdsmeny",
      defaultValue: true,
      admin: {
        position: "sidebar",
        description:
          "Viser en seksjonsmeny (innholdsfortegnelse) ved siden av guiden når den har minst to H2-overskrifter. Skru av for å skjule den.",
      },
    },
    {
      name: "qualityScore",
      type: "number",
      label: "Kvalitetsscore",
      min: 0,
      max: 100,
      admin: {
        position: "sidebar",
        readOnly: true,
        description:
          "Settes av AI-vurderingen (0–100). Kjør den under «Kvalitet»-fanen.",
      },
    },
    {
      name: "qualityReviewedAt",
      type: "date",
      label: "Sist vurdert",
      admin: {
        position: "sidebar",
        readOnly: true,
        date: { displayFormat: "dd.MM.yyyy HH:mm" },
      },
    },
    {
      // Hele vurderingen (oppsummering, delscore, fiks, innholds-hash). Rendres
      // av panelet i «Kvalitet»-fanen; skjult som rått felt fordi JSON-en er
      // stor og stygg.
      name: "qualityReview",
      type: "json",
      label: "Kvalitetsvurdering (rådata)",
      admin: {
        hidden: true,
      },
    },
    {
      name: "relatedGuides",
      type: "relationship",
      relationTo: "guides",
      hasMany: true,
      label: "Relaterte guider",
      admin: {
        position: "sidebar",
      },
    },
  ],
};
