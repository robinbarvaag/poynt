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
          description:
            "Samlesiden /produkter. Produktene hentes automatisk fra Nettbutikk → Produkter — her styrer du bare toppen av siden.",
          fields: [
            {
              name: "hero",
              type: "group",
              label: "Toppen av siden",
              fields: [
                {
                  name: "enabled",
                  type: "checkbox",
                  label: "Vis toppseksjon",
                  defaultValue: true,
                },
                {
                  name: "title",
                  type: "text",
                  label: "Tittel",
                  defaultValue: "Produkter",
                  admin: {
                    description: "Overskriften øverst på siden",
                    condition: (data) => data?.hero?.enabled,
                  },
                },
                {
                  name: "description",
                  type: "textarea",
                  label: "Ingress",
                  defaultValue: "Utforsk våre digitale produkter",
                  admin: {
                    description:
                      "Én–to setninger under tittelen — si hva kunden finner her",
                    condition: (data) => data?.hero?.enabled,
                  },
                },
                {
                  name: "image",
                  type: "upload",
                  relationTo: "media",
                  label: "Bakgrunnsbilde",
                  admin: {
                    description: "Valgfritt bilde bak tittelen",
                    condition: (data) => data?.hero?.enabled,
                  },
                },
              ],
            },
            {
              name: "emptyStateText",
              type: "text",
              label: "Tekst når lista er tom",
              defaultValue: "Ingen produkter tilgjengelig for øyeblikket.",
              admin: {
                description:
                  "Vises bare hvis det ikke finnes noen aktive produkter",
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
