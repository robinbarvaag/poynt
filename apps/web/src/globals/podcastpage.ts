import type { GlobalConfig } from "payload";

export const PodcastPage: GlobalConfig = {
  slug: "podcastpage",
  label: "Podkastside",
  admin: {
    group: "Innhold",
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
                      "Aktivér for å hindre Google fra å indeksere podkastsiden",
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
