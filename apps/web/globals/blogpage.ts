import type { GlobalConfig } from "payload";
import { seoMetaField } from "../fields/seo-meta";

export const BlogPage: GlobalConfig = {
  slug: "blogpage",
  label: "Bloggoversikt",
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
              name: "title",
              type: "text",
              required: true,
              label: "Tittel",
              defaultValue: "Blogg",
              admin: {
                description: "Hovedoverskrift på bloggsiden",
              },
            },
            {
              name: "description",
              type: "textarea",
              label: "Ingress",
              admin: {
                description: "Kort beskrivelse som vises under tittelen",
              },
            },
            {
              name: "emptyStateText",
              type: "text",
              label: "Tekst ved ingen innlegg",
              defaultValue: "Ingen publiserte innlegg ennå. Kom tilbake snart!",
              admin: {
                description:
                  "Tekst som vises når det ikke finnes noen publiserte innlegg",
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
