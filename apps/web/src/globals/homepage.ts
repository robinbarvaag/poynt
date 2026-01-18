import type { GlobalConfig } from "payload";
import { Archive } from "../blocks/archive";
import { Content } from "../blocks/content";
import { CtaSection } from "../blocks/cta-section";
import { Features } from "../blocks/features";
import { Hero } from "../blocks/hero";
import { MediaBlock } from "../blocks/media";
import { SpotifyEmbed } from "../blocks/spotify-embed";
import { Testimonials } from "../blocks/testimonials";

export const Homepage: GlobalConfig = {
  slug: "homepage",
  label: "Forside",
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
              name: "layout",
              type: "blocks",
              label: "Innholdsblokker",
              blocks: [
                Hero,
                Content,
                MediaBlock,
                Archive,
                Features,
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
