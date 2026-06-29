import type { Block } from "payload";
import { sectionHeaderFields } from "./_shared";

/** Lenke-/bokmerke-kort til eksterne ressurser. */
export const GuideBookmark: Block = {
  slug: "guideBookmark",
  interfaceName: "GuideBookmarkBlock",
  labels: { singular: "Bokmerker", plural: "Bokmerker" },
  fields: [
    ...sectionHeaderFields,
    {
      name: "items",
      type: "array",
      label: "Lenker",
      labels: { singular: "Lenke", plural: "Lenker" },
      minRows: 1,
      admin: {
        description:
          "Lim inn URL og lagre – tittel, beskrivelse og bilde hentes automatisk fra lenkens OG-data. Fyll inn feltene manuelt for å overstyre.",
      },
      fields: [
        {
          name: "url",
          type: "text",
          label: "URL",
          admin: {
            description:
              "Lim inn en lenke – forhåndsvisningen hentes automatisk.",
            components: {
              afterInput: [
                "/admin/components/guides/bookmark-og-fetch#BookmarkOgFetch",
              ],
            },
          },
        },
        {
          name: "title",
          type: "text",
          label: "Tittel",
          admin: { description: "Hentes automatisk hvis tom" },
        },
        {
          name: "description",
          type: "textarea",
          label: "Beskrivelse",
          admin: { description: "Hentes automatisk hvis tom" },
        },
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          label: "Forhåndsvisningsbilde (manuell overstyring)",
        },
        {
          name: "imageUrl",
          type: "text",
          label: "OG-bilde (auto)",
          admin: {
            readOnly: true,
            description:
              "Bilde-URL hentet fra lenken. Tøm dette feltet for å hente på nytt ved neste lagring.",
          },
        },
        {
          name: "ogStatus",
          type: "text",
          label: "Hente-status",
          admin: {
            readOnly: true,
            description:
              "Hva som ble hentet fra lenken sist du lagret. Tøm OG-bilde-feltet for å forsøke på nytt.",
          },
        },
      ],
    },
  ],
};
