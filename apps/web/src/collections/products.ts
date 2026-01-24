import type { CollectionConfig } from "payload";

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

export const Products: CollectionConfig = {
  slug: "products",
  labels: {
    singular: "Produkt",
    plural: "Produkter",
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "type", "price", "active", "updatedAt"],
    group: "Butikk",
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
    afterChange: [
      async ({ doc, operation, req }) => {
        if (doc.stripeID && !doc.stripePriceId) {
          try {
            const { getStripe } = await import("@poynt/stripe");
            const stripe = getStripe();
            const price = await stripe.prices.create({
              product: doc.stripeID,
              unit_amount: doc.price,
              currency: 'nok',
            })

            await req.payload.update({
              collection: 'products',
              id: doc.id,
              data: {
                stripePriceId: price.id,
                stripeProductId: doc.stripeID,
              },
            })
          } catch (error) {
            req.payload.logger.error(`Klarte ikke opprette pris i Stripe: ${error}`)
          }
        }
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
        { label: "Kurs", value: "course" },
        { label: "PDF", value: "pdf" },
        { label: "Bundle", value: "bundle" },
      ],
      label: "Produkttype",
      admin: {
        position: "sidebar",
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
        description: "Hovedbilde som vises i oversikter og øverst på produktsiden",
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
      label: "Pris (øre)",
      admin: {
        description: "Pris i øre (100 = 1 kr)",
        position: "sidebar",
      },
    },
    {
      name: "compareAtPrice",
      type: "number",
      label: "Sammenlign med pris (øre)",
      admin: {
        description: "Valgfri førpris for å vise rabatt",
        position: "sidebar",
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
        description: "Velg fordeler som gjelder for dette produktet (hentes fra Produktinnstillinger)",
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
    {
      name: "stripePriceId",
      type: "text",
      label: "Stripe Price ID",
      admin: {
        position: "sidebar",
        readOnly: true,
      },
    },
    {
      name: "stripeProductId",
      type: "text",
      label: "Stripe Product ID",
      admin: {
        position: "sidebar",
        readOnly: true,
      },
    },
  ],
};
