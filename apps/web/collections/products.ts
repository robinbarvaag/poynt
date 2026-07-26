import type { CollectionConfig } from "payload";
import { productStoryBlocks } from "../blocks/product-story";
import {
  qualityDataFields,
  qualityReviewPanel,
} from "../fields/quality-review";
import { stockPickerAfterInput } from "../fields/stock-picker-after-input";
import { generateSlug } from "../lib/generate-slug";
import {
  revalidateCmsAfterChange,
  revalidateCmsAfterDelete,
} from "../lib/revalidate-cms";

export const Products: CollectionConfig = {
  slug: "products",
  labels: {
    singular: "Produkt",
    plural: "Produkter",
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: [
      "name",
      "type",
      "price",
      "qualityScore",
      "active",
      "updatedAt",
    ],
    group: "Nettbutikk",
    // «Preview»-knapp i dokument-headeren → åpner produktet på nettsiden.
    preview: (doc) =>
      doc?.slug
        ? `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/produkter/${doc.slug}`
        : null,
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
      // Hovedkolonnen i faner (samme mønster som Guider/Sider/Tjenester):
      // «Innhold» er selve produktet, «Hjelp og kvalitet» samler skrivehjelp
      // og AI-vurdering utenfor skriveflyten. seoPlugin (tabbedUI) legger
      // «SEO»-fanen til på slutten fordi tabs-feltet står først i fields.
      type: "tabs",
      tabs: [
        {
          label: "Innhold",
          description: "Selve produktet.",
          fields: [
            {
              name: "name",
              type: "text",
              required: true,
              label: "Produktnavn",
            },
            {
              name: "shortDescription",
              type: "textarea",
              label: "Kort beskrivelse",
              admin: {
                description:
                  "Én–to setninger om hva produktet er og hvem det passer for. Vises i produktoversikten og i Google.",
              },
            },
            {
              name: "featuredImage",
              type: "upload",
              relationTo: "media",
              label: "Hovedbilde",
              admin: {
                description:
                  "Vises i produktoversikten og øverst på produktsiden",
                components: {
                  afterInput: stockPickerAfterInput,
                },
              },
            },
            {
              name: "description",
              type: "richText",
              label: "Detaljert beskrivelse",
              admin: {
                description:
                  "Vises på produktsiden ved kjøpsknappen. Si hva kjøperen sitter igjen med — ikke bare hva produktet inneholder.",
              },
            },
            {
              name: "storySections",
              type: "blocks",
              label: "Innholdsseksjoner",
              labels: { singular: "Seksjon", plural: "Seksjoner" },
              blocks: productStoryBlocks,
              admin: {
                initCollapsed: true,
                description:
                  "Fortell mer om produktet under kjøpsseksjonen — tekst, bakside, sitater, PDF-smakebit og video i den rekkefølgen du vil.",
              },
            },
            {
              name: "gallery",
              type: "array",
              label: "Bildegalleri",
              admin: {
                initCollapsed: true,
                description: "Flere bilder som vises på produktsiden",
              },
              fields: [
                {
                  name: "image",
                  type: "upload",
                  relationTo: "media",
                  required: true,
                  label: "Bilde",
                },
                {
                  name: "caption",
                  type: "text",
                  label: "Bildetekst",
                },
              ],
            },
            {
              name: "highlights",
              type: "array",
              label: "Salgspunkt",
              admin: {
                initCollapsed: true,
                description:
                  "Korte punkter som vises rett ved kjøpsknappen — det som gjør det lett å si ja (f.eks. «Gratis frakt», «Foredrag ved 10+ bøker»)",
              },
              fields: [
                {
                  name: "icon",
                  type: "text",
                  label: "Ikon (emoji)",
                  admin: {
                    description: "Valgfri emoji, f.eks. 🚚 eller 🎤",
                  },
                },
                {
                  name: "text",
                  type: "text",
                  required: true,
                  label: "Tekst",
                },
              ],
            },
            {
              name: "pdfFile",
              type: "upload",
              relationTo: "media",
              label: "PDF-fil (leveres på e-post)",
              admin: {
                description:
                  "Selve PDF-en kunden kjøper. Sendes automatisk med ordrebekreftelsen på e-post.",
                condition: (data) => data?.type === "pdf",
              },
            },
            {
              // Småting som endrer hvordan produktet presenteres — samlet
              // nederst så selve innholdet står øverst (kun presentasjon,
              // feltnavn og DB-skjema er uendret).
              type: "collapsible",
              label: "Merkelapp og merknad",
              admin: {
                initCollapsed: true,
                description:
                  "Liten merkelapp på produktkortet og en valgfri beskjed på produktsiden — nyttig ved forhåndssalg og utsolgt.",
              },
              fields: [
                {
                  name: "statusBadge",
                  type: "select",
                  label: "Merkelapp",
                  defaultValue: "none",
                  options: [
                    { label: "Ingen", value: "none" },
                    { label: "Nyhet", value: "new" },
                    { label: "Forhåndssalg", value: "presale" },
                    { label: "Utsolgt", value: "soldout" },
                    { label: "Egendefinert", value: "custom" },
                  ],
                  admin: {
                    description:
                      "Vises på produktkortet og produktsiden (f.eks. «Forhåndssalg»)",
                  },
                },
                {
                  name: "statusBadgeLabel",
                  type: "text",
                  label: "Egendefinert merkelapp-tekst",
                  admin: {
                    condition: (data) => data?.statusBadge === "custom",
                  },
                },
                {
                  name: "noticeTitle",
                  type: "text",
                  label: "Merknad – tittel",
                  admin: {
                    description:
                      "Kort overskrift for merknaden, f.eks. «Forhåndssalg» eller «Godt å vite»",
                  },
                },
                {
                  name: "notice",
                  type: "textarea",
                  label: "Merknad",
                  admin: {
                    description:
                      "Beskjed som vises tydelig på produktsiden (f.eks. «NB! Boka kommer i oktober 2026 – dette er forhåndssalg»)",
                  },
                },
              ],
            },
            {
              type: "collapsible",
              label: "Varianter og antall",
              admin: {
                initCollapsed: true,
                description:
                  "La stå urørt for et vanlig digitalt produkt — da kjøper kunden én, uten valg.",
              },
              fields: [
                {
                  name: "variantLabel",
                  type: "text",
                  label: "Variant-spørsmål",
                  admin: {
                    description:
                      "F.eks. «Signert?». La stå tom om produktet ikke har varianter.",
                  },
                },
                {
                  name: "variantOptions",
                  type: "array",
                  label: "Variant-valg",
                  admin: {
                    description:
                      "Valgene kunden kan velge mellom (f.eks. Ja / Nei).",
                    condition: (data) => Boolean(data?.variantLabel),
                  },
                  fields: [
                    {
                      name: "label",
                      type: "text",
                      required: true,
                      label: "Tekst",
                    },
                    {
                      name: "priceDelta",
                      type: "number",
                      label: "Prisdifferanse (kr)",
                      admin: {
                        description:
                          "Valgfritt – legg til (eller trekk fra, med minus) på prisen for dette valget. La stå tom for samme pris.",
                      },
                    },
                  ],
                },
                {
                  name: "allowQuantity",
                  type: "checkbox",
                  defaultValue: false,
                  label: "Tillat flere (antall-velger)",
                  admin: {
                    description:
                      "Vis en antall-velger på produktsiden. La stå av for digitale produkter der én er nok.",
                  },
                },
              ],
            },
          ],
        },
        {
          label: "Hjelp og kvalitet",
          description:
            "Tips og sjekklister som hjelper deg mens du skriver. Ingenting her vises på nettsiden.",
          fields: [
            {
              // Visuell skrivehjelp: hva/hvorfor/praktisk + live sjekkliste.
              // Produktsjekken under tar seg av de deterministiske
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
              name: "produktsjekk",
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
        description: "Genereres automatisk fra produktnavn",
      },
    },
    {
      name: "type",
      type: "select",
      required: true,
      options: [
        { label: "Produkt", value: "product" },
        { label: "Kurs", value: "course" },
        { label: "PDF", value: "pdf" },
        { label: "Bundle", value: "bundle" },
        { label: "Medlemskap", value: "membership" },
      ],
      label: "Produkttype",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "recurringInterval",
      type: "number",
      label: "Faktureringsintervall (måneder)",
      admin: {
        position: "sidebar",
        description:
          "Antall måneder mellom hver fakturering (f.eks. 1, 3, 6, 12)",
        condition: (data) => data?.type === "membership",
      },
    },
    {
      name: "membershipTier",
      type: "select",
      label: "Medlemskapsnivå",
      options: [
        { label: "Community", value: "community" },
        { label: "Community + AI", value: "community_ai" },
      ],
      admin: {
        position: "sidebar",
        condition: (data) => data?.type === "membership",
      },
    },
    {
      name: "applyUrl",
      type: "text",
      label: "Søknadslenke",
      defaultValue: "/kontakt",
      admin: {
        position: "sidebar",
        description:
          "Medlemskap kjøpes ikke direkte – knappen «Søk om medlemskap» lenker hit",
        condition: (data) => data?.type === "membership",
      },
    },
    {
      name: "price",
      type: "number",
      required: true,
      label: "Pris (kr)",
      admin: {
        description: "Pris i hele kroner",
        position: "sidebar",
      },
    },
    {
      name: "compareAtPrice",
      type: "number",
      label: "Førpris (kr)",
      admin: {
        description: "Valgfritt – vis en overstrøket førpris for å vise rabatt",
        position: "sidebar",
      },
    },
    {
      name: "displayOrder",
      type: "number",
      label: "Visningsrekkefølge",
      index: true,
      admin: {
        position: "sidebar",
        description:
          "Lavere tall vises først i produktoversikten (f.eks. 1 for boka). Produkter uten verdi havner bakerst, nyeste først.",
      },
    },
    {
      name: "active",
      type: "checkbox",
      defaultValue: true,
      label: "Aktiv",
      admin: {
        position: "sidebar",
        description: "Skru av for å skjule produktet fra nettsiden",
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
