import type { GlobalConfig } from "payload";
import { seoMetaField } from "../fields/seo-meta";
import { revalidateCmsAfterChange } from "../lib/revalidate-cms";

export const ProductsPage: GlobalConfig = {
  slug: "productspage",
  label: "Produktoversikt",
  admin: {
    group: "Sideoppsett",
  },
  hooks: {
    afterChange: [revalidateCmsAfterChange],
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
            seoMetaField({
              noIndexDescription:
                "Aktivér for å hindre Google fra å indeksere produktsiden",
            }),
          ],
        },
      ],
    },
  ],
};
