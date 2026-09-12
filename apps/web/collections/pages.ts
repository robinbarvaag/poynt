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
import { secretSlugToken } from "../lib/secret-slug";

export const Pages: CollectionConfig = {
  slug: "pages",
  labels: {
    singular: "Side",
    plural: "Sider",
  },
  admin: {
    // «Åpne på nettsiden» i dokument-headeren → den publiserte URL-en, ny fane.
    components: {
      edit: {
        beforeDocumentControls: [
          "/admin/components/open-on-site-button#OpenOnSiteButton",
        ],
      },
    },
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "updatedAt"],
    group: "Innhold",
    // Begge går via /api/preview som slår på draft mode (krever innlogget
    // admin) — ellers viser «Preview» bare den publiserte versjonen.
    livePreview: {
      url: ({ data }) => {
        const base = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
        const path = data?.slug === "forside" ? "/" : `/${data?.slug}`;
        return `${base}/api/preview?path=${encodeURIComponent(path)}`;
      },
    },
    // «Preview»-knapp i dokument-headeren → åpner utkastet på nettsiden.
    preview: (doc) => {
      const base = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
      if (!doc?.slug) return null;
      const path = doc.slug === "forside" ? "/" : `/${doc.slug}`;
      return `${base}/api/preview?path=${encodeURIComponent(path)}`;
    },
  },
  versions: {
    drafts: {
      autosave: true,
    },
  },
  hooks: {
    beforeValidate: [
      // Kjører FØR påkrevd-sjekken på slug, så en tom slug fylles inn i stedet
      // for å stoppe lagringa. Skjulte sider får et tilfeldig suffiks – en
      // adresse som ikke kan gjettes er hele poenget med dem (QR-kode-sider,
      // kunde-ressurser).
      async ({ data }) => {
        if (!data) return data;
        if (!data.slug && data.title) {
          const base = generateSlug(data.title);
          data.slug = data.unlisted ? `${base}-${secretSlugToken()}` : base;
        }
        return data;
      },
    ],
    beforeChange: [
      async ({ data }) => {
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
              // Uten labels bruker Payload feltnavnet i knappen («Legg til
              // layout»). Singular styrer «Legg til …»-teksten i blokkvelgeren.
              labels: { singular: "blokk", plural: "blokker" },
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
          "Genereres automatisk fra tittel. Bruk 'forside' for forsida. Er «Skjult side» på og slug står tom, får adressen et tilfeldig suffiks som ikke kan gjettes.",
      },
    },
    {
      name: "unlisted",
      type: "checkbox",
      label: "Skjult side (kun via lenke / QR-kode)",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description:
          "Siden er åpen for alle som har adressen, men holdes utenfor Google (noindex), sitemap og menyer. Bruk til QR-kode-sider og ressurser for kunder. Tips: la slug stå tom ved opprettelse, så lages en adresse som er vanskelig å gjette.",
      },
    },
    {
      name: "pageType",
      type: "select",
      label: "Sidetype",
      defaultValue: "standard",
      options: [
        { label: "Vanlig side", value: "standard" },
        { label: "Landingsside", value: "landing" },
        { label: "Oversiktsside med sidemeny", value: "hub" },
      ],
      admin: {
        position: "sidebar",
        description:
          "Landingsside gir siden en mykere fargevask i bakgrunnen og en tynn fremdriftsbar i toppen – for kampanjer og lanseringer. Oversiktsside med sidemeny legger en meny ved siden av innholdet som følger med når man scroller; hver blokk med et «Blokk-navn» blir et menypunkt. For ressurssider med mye innhold.",
      },
    },
    ...qualityDataFields({ sidebarSection: true }),
  ],
};
