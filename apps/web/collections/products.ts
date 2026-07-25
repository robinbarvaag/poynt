import type { CollectionConfig } from "payload";
import { productStoryBlocks } from "../blocks/product-story";
import { stockPickerAfterInput } from "../fields/stock-picker-after-input";
import { generateSlug } from "../lib/generate-slug";

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
      "displayOrder",
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
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      label: "Produktnavn",
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
      name: "shortDescription",
      type: "textarea",
      label: "Kort beskrivelse",
      admin: {
        description: "Vises i produktoversikter og som meta-beskrivelse",
      },
    },
    {
      name: "description",
      type: "richText",
      label: "Detaljert beskrivelse",
      admin: {
        description: "Full produktbeskrivelse som vises på produktsiden",
      },
    },
    {
      name: "storySections",
      type: "blocks",
      label: "Innholdsseksjoner",
      labels: { singular: "Seksjon", plural: "Seksjoner" },
      blocks: productStoryBlocks,
      admin: {
        description:
          "Bygg produktsidens «historie» under kjøpsseksjonen – tekst, bakside, sitater, PDF-smakebit og video i den rekkefølgen du vil. Vises i full bredde.",
      },
    },
    {
      name: "featuredImage",
      type: "upload",
      relationTo: "media",
      label: "Hovedbilde",
      admin: {
        description:
          "Hovedbilde som vises i oversikter og øverst på produktsiden",
        components: {
          afterInput: stockPickerAfterInput,
        },
      },
    },
    {
      name: "gallery",
      type: "array",
      label: "Bildegalleri",
      admin: {
        description: "Ekstra bilder som vises på produktsiden",
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
      name: "pdfFile",
      type: "upload",
      relationTo: "media",
      label: "PDF-fil (leveres på e-post)",
      admin: {
        description:
          "Selve PDF-en kunden kjøper. Legges automatisk ved ordrebekreftelses-eposten når produktet kjøpes.",
        condition: (data) => data?.type === "pdf",
      },
    },
    {
      name: "price",
      type: "number",
      required: true,
      label: "Pris (kr)",
      admin: {
        description: "Pris i heile kroner",
        position: "sidebar",
      },
    },
    {
      name: "compareAtPrice",
      type: "number",
      label: "Samanlikningspris (kr)",
      admin: {
        description: "Valgfri førpris for å vise rabatt",
        position: "sidebar",
      },
    },
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
          "Liten merkelapp som vises på produktkort og produktsiden (f.eks. «Forhåndssalg»)",
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
          "Kort overskrift for merknaden, f.eks. «Forhåndssalg» eller «Godt å vite». Vises på linje med ikonet, med selve merknaden under.",
      },
    },
    {
      name: "notice",
      type: "textarea",
      label: "Merknad / forhåndssalg-tekst",
      admin: {
        description:
          "Valgfri melding som vises tydelig på produktsiden (f.eks. «NB! Boka kommer i oktober 2026 – dette er forhåndssalg»)",
      },
    },
    {
      name: "highlights",
      type: "array",
      label: "Salgspunkt",
      admin: {
        description:
          "Korte salgbare punkter (f.eks. «Gratis frakt», «Foredrag ved 10+ bøker») som løftes frem rett ved kjøpsknappen",
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
      name: "allowQuantity",
      type: "checkbox",
      defaultValue: false,
      label: "Tillat flere (antall-velger)",
      admin: {
        position: "sidebar",
        description:
          "Vis en antall-velger på produktsiden. La stå av for digitale produkter der man bare trenger én.",
      },
    },
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
        description: "Valgene kunden kan velge mellom (f.eks. Ja / Nei).",
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
              "Valgfritt – legg til (eller trekk fra, med minus) på basisprisen for dette valget. La stå tom for samme pris.",
          },
        },
      ],
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
      name: "displayOrder",
      type: "number",
      label: "Visningsrekkefølge",
      index: true,
      admin: {
        position: "sidebar",
        description:
          "Styrer rekkefølgen i produktoversikten – lavest tall vises først (f.eks. 1 for boka). Produkter uten verdi havner bakerst, sortert på nyeste først.",
      },
    },
    {
      name: "active",
      type: "checkbox",
      defaultValue: true,
      label: "Aktiv",
      admin: {
        position: "sidebar",
        description: "Deaktiver for å skjule produktet",
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
  ],
};
