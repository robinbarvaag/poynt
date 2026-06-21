import type { GlobalConfig } from "payload";
import { seoMetaField } from "../fields/seo-meta";

export const ServicesPage: GlobalConfig = {
  slug: "servicespage",
  label: "Tjenesteoversikt",
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
                  defaultValue: "Tjenester",
                  admin: {
                    condition: (data) => data?.hero?.enabled,
                  },
                },
                {
                  name: "description",
                  type: "textarea",
                  label: "Beskrivelse",
                  defaultValue: "Se hva vi kan hjelpe deg med",
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
              label: "Tekst ved ingen tjenester",
              defaultValue: "Ingen tjenester tilgjengelig for øyeblikket.",
              admin: {
                description:
                  "Tekst som vises når det ikke finnes noen aktive tjenester",
              },
            },
            {
              name: "detailCta",
              type: "group",
              label: "CTA på tjeneste-detaljsider",
              admin: {
                description:
                  "Felles oppfordring som vises nederst på hver enkelt tjenesteside",
              },
              fields: [
                {
                  name: "variant",
                  type: "select",
                  label: "Stil",
                  defaultValue: "colored",
                  options: [
                    { label: "Enkel (på sidebakgrunn)", value: "simple" },
                    { label: "Farget panel", value: "colored" },
                  ],
                },
                {
                  name: "title",
                  type: "text",
                  label: "Tittel",
                  defaultValue: "Interessert?",
                },
                {
                  name: "description",
                  type: "textarea",
                  label: "Beskrivelse",
                  defaultValue:
                    "Ta kontakt for en uforpliktende prat om hvordan vi kan hjelpe deg.",
                },
                {
                  name: "primaryCta",
                  type: "group",
                  label: "Knapp",
                  fields: [
                    {
                      name: "text",
                      type: "text",
                      label: "Knappetekst",
                      defaultValue: "Ta kontakt",
                    },
                    {
                      name: "url",
                      type: "text",
                      label: "Lenke",
                      defaultValue: "/kontakt",
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: "SEO",
          fields: [
            seoMetaField({
              noIndexDescription:
                "Aktivér for å hindre Google fra å indeksere tjenestesiden",
            }),
          ],
        },
      ],
    },
  ],
};
