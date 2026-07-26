import type { GlobalConfig } from "payload";
import { seoMetaField } from "../fields/seo-meta";
import { revalidateCmsAfterChange } from "../lib/revalidate-cms";

export const BlogPage: GlobalConfig = {
  slug: "blogpage",
  label: "Bloggoversikt",
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
            "Samlesiden /blogg. Innleggene hentes automatisk fra Blogginnlegg — her styrer du bare toppen av siden.",
          fields: [
            {
              name: "title",
              type: "text",
              required: true,
              label: "Tittel",
              defaultValue: "Blogg",
              admin: {
                description: "Overskriften øverst på siden",
              },
            },
            {
              name: "description",
              type: "textarea",
              label: "Ingress",
              admin: {
                description:
                  "Én–to setninger under tittelen — si hva leseren finner her",
              },
            },
            {
              name: "emptyStateText",
              type: "text",
              label: "Tekst når lista er tom",
              defaultValue: "Ingen publiserte innlegg ennå. Kom tilbake snart!",
              admin: {
                description:
                  "Vises bare hvis det ikke finnes noen publiserte innlegg",
              },
            },
          ],
        },
        {
          label: "SEO",
          fields: [
            seoMetaField({
              noIndexDescription:
                "Aktivér for å hindre Google fra å indeksere bloggsiden",
            }),
          ],
        },
      ],
    },
  ],
};
