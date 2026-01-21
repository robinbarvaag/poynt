import type { GlobalConfig } from "payload";

export const BlogPage: GlobalConfig = {
  slug: "blogpage",
  label: "Bloggside",
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
                description: "Tekst som vises når det ikke finnes noen publiserte innlegg",
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
                    description: "Kort beskrivelse som vises i søkeresultater (maks 160 tegn)",
                  },
                },
                {
                  name: "image",
                  type: "upload",
                  relationTo: "media",
                  label: "Dellingsbilde",
                  admin: {
                    description: "Bilde som vises ved deling på sosiale medier (1200x630px anbefalt)",
                  },
                },
                {
                  name: "noIndex",
                  type: "checkbox",
                  label: "Skjul fra søkemotorer",
                  defaultValue: false,
                  admin: {
                    description: "Aktivér for å hindre Google fra å indeksere bloggsiden",
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
