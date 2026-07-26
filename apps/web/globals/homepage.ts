import type { GlobalConfig } from "payload";
import { layoutBlocks } from "../blocks/layout-blocks";
import { seoMetaField } from "../fields/seo-meta";
import { revalidateCmsAfterChange } from "../lib/revalidate-cms";

export const Homepage: GlobalConfig = {
  slug: "homepage",
  label: "Forside",
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
              name: "komposisjonssjekk",
              type: "ui",
              admin: {
                components: {
                  Field: "/admin/components/composition-check#CompositionCheck",
                },
              },
            },
            {
              name: "layout",
              type: "blocks",
              label: "Innholdsblokker",
              admin: {
                description:
                  "Bygg forsiden med blokker. Hero = stor intro, Innhold = tekst, Media = bilde/video, Skjema = kontaktskjema, Produkter/Tjenester/Podcast = automatiske lister, Anmeldelser = kundeomtaler, CTA = handlingsoppfordring.",
              },
              blocks: layoutBlocks,
            },
          ],
        },
        {
          label: "SEO",
          fields: [
            seoMetaField({
              noIndexDescription:
                "Aktivér for å hindre Google fra å indeksere forsiden",
            }),
          ],
        },
      ],
    },
  ],
};
