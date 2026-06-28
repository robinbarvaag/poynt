import type { CollectionConfig } from "payload";
import { guideBlocks } from "../blocks/guide-blocks";
import { stockPickerAfterInput } from "../fields/stock-picker-after-input";
import { generateSlug } from "../lib/generate-slug";

/**
 * Guider = On-Poynt sitt ressursbibliotek (tidligere i Notion). Blokk-basert
 * innhold som rendres med leken motion på `/on-poynt/ressurser`. `section`
 * styrer grupperingen på hub-en (speiler Notion-forsidens seksjoner).
 */
export const Guides: CollectionConfig = {
  slug: "guides",
  labels: {
    singular: "Guide",
    plural: "Guider",
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "section", "category", "order", "status"],
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
      name: "icon",
      type: "text",
      label: "Emoji-ikon",
      admin: {
        position: "sidebar",
        description: "Vises ved tittelen, f.eks. 📸 eller ✨",
      },
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
        description: "Kort introduksjon som vises i hero og i listevisning",
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
      name: "content",
      type: "blocks",
      label: "Innhold",
      blocks: guideBlocks,
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
