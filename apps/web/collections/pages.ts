import type { CollectionConfig } from "payload";
import { Content } from "../blocks/content";
import { ContentMedia } from "../blocks/content-media";
import { CtaSection } from "../blocks/cta-section";
import { Faq } from "../blocks/faq";
import { FeatureGrid } from "../blocks/feature-grid";
import { FormBlock } from "../blocks/form";
import { Hero } from "../blocks/hero";
import { LogoCloud } from "../blocks/logo-cloud";
import { MediaBlock } from "../blocks/media";
import { Newsletter } from "../blocks/newsletter";
import { PodcastArchive } from "../blocks/podcast-archive";
import { Pricing } from "../blocks/pricing";
import { ProductArchive } from "../blocks/product-archive";
import { ServicesArchive } from "../blocks/services-archive";
import { SpotifyEmbed } from "../blocks/spotify-embed";
import { StatsBand } from "../blocks/stats-band";
import { Steps } from "../blocks/steps";
import { Testimonials } from "../blocks/testimonials";
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
      blocks: [
        Hero,
        Content,
        FeatureGrid,
        Steps,
        ContentMedia,
        StatsBand,
        Pricing,
        Faq,
        LogoCloud,
        Newsletter,
        MediaBlock,
        FormBlock,
        ProductArchive,
        PodcastArchive,
        ServicesArchive,
        Testimonials,
        CtaSection,
        SpotifyEmbed,
      ],
    },
    // SEO-felt kommer automatisk fra seoPlugin
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
