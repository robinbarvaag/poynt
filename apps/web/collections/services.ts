import type { CollectionConfig } from "payload";
import { generateSlug } from "../lib/generate-slug";

export const Services: CollectionConfig = {
  slug: "services",
  labels: {
    singular: "Tjeneste",
    plural: "Tjenester",
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "priceType", "sortOrder", "updatedAt"],
    group: "Innhold",
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
      label: "Tjenestenavn",
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
        description: "Genereres automatisk fra navn",
      },
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      label: "Bilde",
      admin: {
        description: "Vises i tjenesteoversikten",
      },
    },
    {
      name: "shortDescription",
      type: "textarea",
      required: true,
      label: "Kort beskrivelse",
      admin: {
        description: "Vises i oversikten på forsiden",
      },
    },
    {
      name: "content",
      type: "richText",
      label: "Detaljert beskrivelse",
      admin: {
        description: "Valgfritt - vises på tjenestesiden",
      },
    },
    {
      name: "priceType",
      type: "select",
      required: true,
      defaultValue: "fixed",
      label: "Pristype",
      options: [
        { label: "Fast pris", value: "fixed" },
        { label: "Fra-pris", value: "from" },
        { label: "Per måned", value: "monthly" },
        { label: "Ta kontakt for pris", value: "contact" },
      ],
    },
    {
      name: "price",
      type: "number",
      label: "Pris (kr)",
      admin: {
        description: "Pris i hele kroner (eks. mva)",
        condition: (data) => data.priceType !== "contact",
      },
    },
    {
      name: "includesVat",
      type: "checkbox",
      label: "Vis '+ mva' etter pris",
      defaultValue: true,
      admin: {
        condition: (data) => data.priceType !== "contact",
      },
    },
    {
      name: "ctaText",
      type: "text",
      label: "Knappetekst",
      defaultValue: "Les mer",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "ctaLink",
      type: "text",
      label: "Knapp-lenke",
      admin: {
        position: "sidebar",
        description: "Valgfritt - overstyr standard lenke til tjenestesiden",
      },
    },
    {
      name: "sortOrder",
      type: "number",
      label: "Sorteringsrekkefølge",
      defaultValue: 0,
      admin: {
        position: "sidebar",
        description: "Lavere tall vises først",
      },
    },
    {
      name: "active",
      type: "checkbox",
      label: "Aktiv",
      defaultValue: true,
      admin: {
        position: "sidebar",
        description: "Deaktiver for å skjule tjenesten",
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
