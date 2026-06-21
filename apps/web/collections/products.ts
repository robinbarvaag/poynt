import type { CollectionConfig } from "payload";
import { generateSlug } from "../lib/generate-slug";

export const Products: CollectionConfig = {
  slug: "products",
  labels: {
    singular: "Produkt",
    plural: "Produkter",
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "type", "price", "active", "updatedAt"],
    group: "Nettbutikk",
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
      label: "Faktureringsintervall (månader)",
      admin: {
        position: "sidebar",
        description: "Antal månader mellom kvar fakturering (t.d. 1, 3, 6, 12)",
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
      name: "featuredImage",
      type: "upload",
      relationTo: "media",
      label: "Hovedbilde",
      admin: {
        description:
          "Hovedbilde som vises i oversikter og øverst på produktsiden",
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
          "Liten merkelapp som vises på produktkort og produktsiden (t.d. «Forhåndssalg»)",
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
      name: "notice",
      type: "textarea",
      label: "Merknad / forhåndssalg-tekst",
      admin: {
        description:
          "Valgfri melding som vises tydeleg på produktsiden (t.d. «NB! Boka kjem i oktober 2026 – dette er forhåndssal»)",
      },
    },
    {
      name: "highlights",
      type: "array",
      label: "Salgspunkt",
      admin: {
        description:
          "Korte salgbare punkt (t.d. «Gratis frakt», «Foredrag ved 10+ bøker») som poppast fram rett ved kjøpsknappen",
      },
      fields: [
        {
          name: "icon",
          type: "text",
          label: "Ikon (emoji)",
          admin: {
            description: "Valgfri emoji, t.d. 🚚 eller 🎤",
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
      label: "Tillat fleire (antal-veljar)",
      admin: {
        position: "sidebar",
        description:
          "Vis ein antal-veljar på produktsiden. Lat stå av for digitale produkt der ein berre treng éin.",
      },
    },
    {
      name: "variantLabel",
      type: "text",
      label: "Variant-spørsmål",
      admin: {
        description:
          "T.d. «Signert?». Lat stå tom om produktet ikkje har variantar.",
      },
    },
    {
      name: "variantOptions",
      type: "array",
      label: "Variant-valg",
      admin: {
        description: "Vala kunden kan velje mellom (t.d. Ja / Nei).",
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
              "Valfritt – legg til (eller trekk frå, med minus) basisprisen for dette valet. Lat stå tom for same pris.",
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
          "Medlemskap kjøpes ikkje direkte – knappen «Søk om medlemskap» lenkjer hit",
        condition: (data) => data?.type === "membership",
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
      name: "benefits",
      type: "json",
      label: "Fordeler",
      admin: {
        description:
          "Velg fordeler som gjelder for dette produktet (hentes fra Produktinnstillinger)",
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
