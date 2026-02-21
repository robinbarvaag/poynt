import type { GlobalConfig } from "payload";
import { Content } from "../blocks/content";
import { CtaSection } from "../blocks/cta-section";
import { FormBlock } from "../blocks/form";
import { Hero } from "../blocks/hero";
import { MediaBlock } from "../blocks/media";
import { PodcastArchive } from "../blocks/podcast-archive";
import { ProductArchive } from "../blocks/product-archive";
import { ServicesArchive } from "../blocks/services-archive";
import { SpotifyEmbed } from "../blocks/spotify-embed";
import { Testimonials } from "../blocks/testimonials";

export const Homepage: GlobalConfig = {
  slug: "homepage",
  label: "Forside",
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
              name: "layout",
              type: "blocks",
              label: "Innholdsblokker",
              admin: {
                description:
                  "Bygg forsiden med blokker. Hero = stor intro, Innhold = tekst, Media = bilde/video, Skjema = kontaktskjema, Produkter/Tjenester/Podcast = automatiske lister, Anmeldelser = kundeomtaler, CTA = handlingsoppfordring.",
              },
              blocks: [
                Hero,
                Content,
                MediaBlock,
                FormBlock,
                PodcastArchive,
                ProductArchive,
                ServicesArchive,
                Testimonials,
                CtaSection,
                SpotifyEmbed,
              ],
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
                      "Aktivér for å hindre Google fra å indeksere forsiden",
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
