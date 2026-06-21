import type { CollectionConfig } from "payload";
import { layoutBlocks } from "../blocks/layout-blocks";
import { seoFaqField } from "../fields/seo-meta";
import { generateSlug } from "../lib/generate-slug";

export const Pages: CollectionConfig = {
  slug: "pages",
  labels: {
    singular: "Side",
    plural: "Sider",
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "updatedAt"],
    group: "Innhold",
    livePreview: {
      url: ({ data }) => {
        const slug = data?.slug;
        if (slug === "forside")
          return process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
        return `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/${slug}`;
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
      async ({ data, originalDoc, req, operation }) => {
        // Auto-generer slug fra tittel hvis ikke satt
        if (!data.slug && data.title) {
          data.slug = generateSlug(data.title);
        }

        // Redirects plugin håndterer automatisk redirect ved slug-endring
        // når collection er registrert i pluginet

        return data;
      },
    ],
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      label: "Sidetittel",
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
        description:
          "Genereres automatisk fra tittel. Bruk 'forside' for forsida.",
      },
    },
    {
      name: "excerpt",
      type: "textarea",
      label: "Utdrag",
      admin: {
        description: "Kort beskrivelse som brukes til SEO og deling",
      },
    },
    {
      name: "layout",
      type: "blocks",
      label: "Sidelayout",
      admin: {
        description:
          "Bygg siden med blokker. Hero = stor intro-seksjon, Innholdsblokk = rik tekst, Mediablokk = bilde/video, Skjema = kontaktskjema, Produkter/Tjenester/Podcast = lister fra databasen, Anmeldelser = kundeomtaler, CTA = handlingsoppfordring, Spotify = podcast-spiller.",
      },
      blocks: layoutBlocks,
    },
    // SEO-felt kommer automatisk fra seoPlugin
    seoFaqField(),
    {
      name: "publishedAt",
      type: "date",
      label: "Publiseringsdato",
      admin: {
        position: "sidebar",
        date: {
          pickerAppearance: "dayAndTime",
        },
      },
    },
  ],
};
