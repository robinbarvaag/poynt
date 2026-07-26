import type { GlobalConfig } from "payload";
import { seoMetaField } from "../fields/seo-meta";
import { revalidateCmsAfterChange } from "../lib/revalidate-cms";

export const PodcastPage: GlobalConfig = {
  slug: "podcastpage",
  label: "Podkastoversikt",
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
            "Samlesiden /podkast. Episodene hentes automatisk fra podkast-feeden — her styrer du bare toppen av siden.",
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
                  defaultValue: "Podkast",
                  admin: {
                    description: "Overskriften øverst på siden",
                    condition: (data) => data?.hero?.enabled,
                  },
                },
                {
                  name: "description",
                  type: "textarea",
                  label: "Ingress",
                  defaultValue: "Lytt til alle episoder",
                  admin: {
                    description:
                      "Én–to setninger under tittelen — si hva lytteren finner her",
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
              defaultValue: "Ingen episoder publisert ennå. Kom tilbake snart!",
              admin: {
                description:
                  "Vises bare hvis det ikke finnes noen episoder i feeden",
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
