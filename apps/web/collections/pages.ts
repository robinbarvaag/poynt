import type { CollectionConfig } from "payload";
import { layoutBlocks } from "../blocks/layout-blocks";
import {
  qualityDataFields,
  qualityReviewPanel,
} from "../fields/quality-review";
import { seoFaqField } from "../fields/seo-meta";
import { generateSlug } from "../lib/generate-slug";
import {
  revalidateCmsAfterChange,
  revalidateCmsAfterDelete,
} from "../lib/revalidate-cms";

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
    // «Preview»-knapp i dokument-headeren → åpner siden på nettsiden.
    preview: (doc) => {
      const base = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
      if (!doc?.slug) return null;
      return doc.slug === "forside" ? base : `${base}/${doc.slug}`;
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
    afterChange: [revalidateCmsAfterChange],
    afterDelete: [revalidateCmsAfterDelete],
  },
  fields: [
    {
      // Hovedkolonnen i faner (samme mønster som Guider): «Innhold» er selve
      // siden, «Hjelp og kvalitet» samler skrivehjelp, sidesjekk og
      // AI-vurdering utenfor skriveflyten. seoPlugin (tabbedUI) legger
      // «SEO»-fanen til på slutten fordi tabs-feltet står først i fields.
      type: "tabs",
      tabs: [
        {
          label: "Innhold",
          description: "Selve siden.",
          fields: [
            {
              name: "title",
              type: "text",
              required: true,
              label: "Sidetittel",
            },
            {
              name: "layout",
              type: "blocks",
              label: "Sidelayout",
              admin: {
                initCollapsed: true,
                description:
                  "Bygg siden med blokker. Hero = stor intro-seksjon, Innholdsblokk = rik tekst, Mediablokk = bilde/video, Skjema = kontaktskjema, Produkter/Tjenester/Podcast = lister fra databasen, Anmeldelser = kundeomtaler, CTA = handlingsoppfordring, Spotify = podcast-spiller.",
              },
              blocks: layoutBlocks,
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
              // Visuell skrivehjelp: løfte/bevis/handling + live sjekkliste.
              // Sidesjekken under tar seg av de deterministiske
              // blokk-reglene.
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
              name: "komposisjonssjekk",
              type: "ui",
              admin: {
                components: {
                  Field: "/admin/components/composition-check#CompositionCheck",
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
        description:
          "Genereres automatisk fra tittel. Bruk 'forside' for forsida.",
      },
    },
    ...qualityDataFields({ sidebarSection: true }),
  ],
};
