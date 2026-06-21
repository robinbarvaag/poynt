import type { GlobalConfig } from "payload";
import { seoMetaField } from "../fields/seo-meta";

export const PodcastPage: GlobalConfig = {
  slug: "podcastpage",
  label: "Podkastoversikt",
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
                  defaultValue: "Podkast",
                  admin: {
                    condition: (data) => data?.hero?.enabled,
                  },
                },
                {
                  name: "description",
                  type: "textarea",
                  label: "Beskrivelse",
                  defaultValue: "Lytt til alle episoder",
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
              label: "Tekst ved ingen episoder",
              defaultValue: "Ingen episoder publisert ennå. Kom tilbake snart!",
              admin: {
                description:
                  "Tekst som vises når det ikke finnes noen publiserte episoder",
              },
            },
          ],
        },
        {
          label: "SEO",
          fields: [
            seoMetaField({
              noIndexDescription:
                "Aktivér for å hindre Google fra å indeksere podkastsiden",
            }),
          ],
        },
      ],
    },
  ],
};
