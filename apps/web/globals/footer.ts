import type { GlobalConfig } from "payload";
import { revalidateCmsAfterChange } from "../lib/revalidate-cms";

export const Footer: GlobalConfig = {
  slug: "footer",
  label: "Bunntekst",
  admin: {
    group: "Innstillinger",
  },
  hooks: {
    afterChange: [revalidateCmsAfterChange],
  },
  fields: [
    {
      name: "columns",
      type: "array",
      label: "Kolonner",
      maxRows: 4,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: "/admin/components/row-labels#ColumnRowLabel",
        },
      },
      fields: [
        {
          name: "title",
          type: "text",
          required: true,
          label: "Kolonnetittel",
        },
        {
          name: "links",
          type: "array",
          label: "Lenker",
          maxRows: 8,
          admin: {
            initCollapsed: true,
            components: {
              RowLabel: "/admin/components/row-labels#LinkRowLabel",
            },
          },
          fields: [
            {
              name: "label",
              type: "text",
              required: true,
              label: "Lenketekst",
            },
            {
              name: "linkType",
              type: "radio",
              defaultValue: "internal",
              options: [
                { label: "Intern side", value: "internal" },
                { label: "Ekstern URL", value: "external" },
              ],
              label: "Type",
            },
            {
              name: "page",
              type: "relationship",
              relationTo: "pages",
              label: "Side",
              admin: {
                condition: (_, siblingData) =>
                  siblingData?.linkType === "internal",
              },
            },
            {
              name: "url",
              type: "text",
              label: "URL",
              admin: {
                condition: (_, siblingData) =>
                  siblingData?.linkType === "external",
              },
            },
          ],
        },
      ],
    },
    {
      name: "bottomText",
      type: "richText",
      label: "Bunntekst",
      admin: {
        description: "Vises nederst i footeren, f.eks. copyright",
      },
    },
    {
      name: "showSocialLinks",
      type: "checkbox",
      defaultValue: true,
      label: "Vis sosiale medier-lenker",
      admin: {
        description: "Henter fra Nettsted-innstillinger",
      },
    },
    {
      type: "collapsible",
      label: "Nyhetsbrev",
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: "showNewsletter",
          type: "checkbox",
          defaultValue: false,
          label: "Vis nyhetsbrev-påmelding",
        },
        {
          name: "newsletterTitle",
          type: "text",
          label: "Nyhetsbrev-tittel",
          defaultValue: "Hold deg oppdatert",
          admin: {
            condition: (_, siblingData) => siblingData?.showNewsletter,
          },
        },
        {
          name: "newsletterDescription",
          type: "text",
          label: "Nyhetsbrev-beskrivelse",
          admin: {
            condition: (_, siblingData) => siblingData?.showNewsletter,
          },
        },
      ],
    },
  ],
};
