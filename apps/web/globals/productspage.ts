import type { GlobalConfig } from "payload";

export const ProductsPage: GlobalConfig = {
  slug: "productspage",
  label: "Produktoversikt",
  admin: {
    group: "Sideoppsett",
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Innhold",
          fields: [
            {
              name: "hero",
              type: "group",
              label: "Hero-seksjon",
              fields: [
                {
                  name: "enabled",
                  type: "checkbox",
                  label: "Vis Hero-seksjon",
                  defaultValue: true,
                },
                {
                  name: "title",
                  type: "text",
                  label: "Tittel",
                  defaultValue: "Produkter",
                  admin: {
                    condition: (data) => data?.hero?.enabled,
                  },
                },
                {
                  name: "description",
                  type: "textarea",
                  label: "Beskrivelse",
                  defaultValue: "Utforsk våre digitale produkter",
                  admin: {
                    condition: (data) => data?.hero?.enabled,
                  },
                },
                {
                  name: "image",
                  type: "upload",
                  relationTo: "media",
                  label: "Bakgrunnsbilde",
                  admin: {
                    description: "Valgfritt bakgrunnsbilde for Hero-seksjonen",
                    condition: (data) => data?.hero?.enabled,
                  },
                },
              ],
            },
            {
              name: "emptyStateText",
              type: "text",
              label: "Tekst ved ingen produkter",
              defaultValue: "Ingen produkter tilgjengelig for øyeblikket.",
              admin: {
                description:
                  "Tekst som vises når det ikke finnes noen aktive produkter",
              },
            },
          ],
        },
        {
          label: "SEO",
          fields: [
            {
              name: "meta",
              type: "group",
              label: "SEO-innstillinger",
              fields: [
                {
                  name: "title",
                  type: "text",
                  label: "Meta-tittel",
                  admin: {
                    description: "Vises i nettleser-fanen og i søkeresultater",
                  },
                },
                {
                  name: "description",
                  type: "textarea",
                  label: "Meta-beskrivelse",
                  admin: {
                    description:
                      "Kort beskrivelse som vises i søkeresultater (maks 160 tegn)",
                  },
                },
                {
                  name: "image",
                  type: "upload",
                  relationTo: "media",
                  label: "Dellingsbilde",
                  admin: {
                    description:
                      "Bilde som vises ved deling på sosiale medier (1200x630px anbefalt)",
                  },
                },
                {
                  name: "noIndex",
                  type: "checkbox",
                  label: "Skjul fra søkemotorer",
                  defaultValue: false,
                  admin: {
                    description:
                      "Aktivér for å hindre Google fra å indeksere produktsiden",
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
