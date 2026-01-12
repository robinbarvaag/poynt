import type { CollectionConfig } from "payload";
import { Hero } from "../blocks/hero";
import { Content } from "../blocks/content";
import { MediaBlock } from "../blocks/media";
import { Archive } from "../blocks/archive";
import { Features } from "../blocks/features";
import { Testimonials } from "../blocks/testimonials";
import { CtaSection } from "../blocks/cta-section";

// Utility for å generere slug
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[æ]/g, "ae")
    .replace(/[ø]/g, "o")
    .replace(/[å]/g, "a")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const Pages: CollectionConfig = {
  slug: "pages",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "updatedAt"],
    livePreview: {
      url: ({ data }) => {
        const slug = data?.slug;
        if (slug === "forside") return process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
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
        description: "Genereres automatisk fra tittel. Bruk 'forside' for forsida.",
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
      blocks: [Hero, Content, MediaBlock, Archive, Features, Testimonials, CtaSection],
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
