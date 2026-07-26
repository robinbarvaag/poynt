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
      // Samme fane-mønster som Sider: «Innhold» er selve forsiden, «Hjelp og
      // kvalitet» samler skrivehjelp og sidesjekk utenfor skriveflyten.
      // Globaler dekkes ikke av seoPlugin, så SEO-fanen er manuell
      // (seoMetaField) — men ligger sist, på samme plass som på Sider.
      type: "tabs",
      tabs: [
        {
          label: "Innhold",
          description: "Selve forsiden.",
          fields: [
            {
              name: "layout",
              type: "blocks",
              label: "Innholdsblokker",
              admin: {
                initCollapsed: true,
                description:
                  "Bygg forsiden med blokker. Hero = stor intro, Innholdsblokk = tekst, Mediablokk = bilde/video, Skjema = kontaktskjema, Produkter/Tjenester/Podcast = automatiske lister, Anmeldelser = kundeomtaler, CTA = handlingsoppfordring.",
              },
              blocks: layoutBlocks,
            },
          ],
        },
        {
          label: "Hjelp og kvalitet",
          description:
            "Tips og sjekklister som hjelper deg mens du bygger. Ingenting her vises på nettsiden.",
          fields: [
            {
              // Visuell skrivehjelp: løfte/bevis/handling + live sjekkliste.
              // Sidesjekken under tar seg av de deterministiske blokk-reglene.
              name: "retningslinjer",
              type: "ui",
              admin: {
                components: {
                  Field:
                    "/admin/components/content-guidelines#ContentGuidelines",
                },
              },
            },
            {
              name: "komposisjonssjekk",
              type: "ui",
              admin: {
                components: {
                  Field: "/admin/components/composition-check#CompositionCheck",
                },
              },
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
