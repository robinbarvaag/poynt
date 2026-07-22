import type { CollectionConfig } from "payload";
import {
  qualityDataFields,
  qualityReviewPanel,
} from "../fields/quality-review";
import { stockPickerAfterInput } from "../fields/stock-picker-after-input";
import { generateSlug } from "../lib/generate-slug";

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
    description:
      "Fag og aktualitet med dato: tips, innsikt, meninger og nyheter. Handler teksten om én kundes reise og resultat, skriv den som Kundehistorie i stedet.",
    livePreview: {
      url: ({ data }) => {
        return `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/blogg/${data?.slug}`;
      },
    },
    // «Preview»-knapp i dokument-headeren → åpner innlegget på nettsiden.
    preview: (doc) =>
      doc?.slug
        ? `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/blogg/${doc.slug}`
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
      // Visuell skrivehjelp øverst: krok/kjøtt/landing + live sjekkliste.
      name: "retningslinjer",
      type: "ui",
      admin: {
        components: {
          Field: "/admin/components/content-guidelines#ContentGuidelines",
        },
      },
    },
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
      admin: {
        components: {
          afterInput: stockPickerAfterInput,
        },
      },
    },
    qualityReviewPanel(),
    {
      name: "content",
      type: "richText",
      required: true,
      label: "Innhold",
    },
    {
      // Sidebar-ro: publiseringsvalgene samlet i én sammenleggbar seksjon
      // (kun presentasjon — feltnavn og DB-skjema er uendret).
      type: "collapsible",
      label: "Publisering",
      admin: {
        position: "sidebar",
        initCollapsed: false,
      },
      fields: [
        {
          name: "author",
          type: "relationship",
          relationTo: "users",
          label: "Forfatter",
        },
        {
          name: "categories",
          type: "relationship",
          relationTo: "categories",
          hasMany: true,
          label: "Kategorier",
        },
        {
          name: "publishedAt",
          type: "date",
          required: true,
          label: "Publiseringsdato",
          admin: {
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
        },
      ],
    },
    ...qualityDataFields({ sidebarSection: true }),
  ],
};
