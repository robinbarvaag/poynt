import type { GlobalConfig } from "payload";
import { seoMetaField } from "../fields/seo-meta";
import { revalidateCmsAfterChange } from "../lib/revalidate-cms";

export const ServicesPage: GlobalConfig = {
  slug: "servicespage",
  label: "Tjenesteoversikt",
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
            "Samlesiden /tjenester. Tjenestene hentes automatisk fra Innhold → Tjenester — her styrer du toppen av siden og den felles oppfordringen nederst på hver tjenesteside.",
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
                  defaultValue: "Tjenester",
                  admin: {
                    description: "Overskriften øverst på siden",
                    condition: (data) => data?.hero?.enabled,
                  },
                },
                {
                  name: "description",
                  type: "textarea",
                  label: "Ingress",
                  defaultValue: "Se hva vi kan hjelpe deg med",
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
              defaultValue: "Ingen tjenester tilgjengelig for øyeblikket.",
              admin: {
                description:
                  "Vises bare hvis det ikke finnes noen aktive tjenester",
              },
            },
            {
              name: "detailCta",
              type: "group",
              label: "Oppfordring nederst på tjenestesidene",
              admin: {
                description:
                  "Den samme «ta kontakt»-seksjonen vises nederst på hver enkelt tjenesteside — du slipper å skrive den per tjeneste.",
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
                  label: "Tekst",
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
