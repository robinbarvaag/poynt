import type { GlobalConfig } from "payload";
import { revalidateCmsAfterChange } from "../lib/revalidate-cms";

export const Footer: GlobalConfig = {
  slug: "footer",
  label: "Bunntekst",
  admin: {
    group: "Sideoppsett",
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
      // Strukturert bunnlinje i stedet for fri rik tekst: hvert felt rendres
      // på sin faste plass, så linjen alltid ser ordentlig ut.
      name: "legal",
      type: "group",
      label: "Bunnlinje",
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "companyName",
              type: "text",
              label: "Firmanavn",
              defaultValue: "Poynt AS",
              admin: {
                width: "50%",
                description: "Vises som «© årstall Firmanavn».",
              },
            },
            {
              name: "orgNumber",
              type: "text",
              label: "Organisasjonsnummer",
              admin: {
                width: "50%",
                placeholder: "930 714 151 MVA",
              },
            },
          ],
        },
        {
          type: "row",
          fields: [
            {
              name: "address",
              type: "text",
              label: "Adresse",
              admin: {
                width: "50%",
                placeholder: "Ramsvigstien 5A, 4015 Stavanger",
              },
            },
            {
              name: "email",
              type: "email",
              label: "E-post",
              admin: {
                width: "50%",
                placeholder: "hei@poynt.no",
              },
            },
          ],
        },
        {
          name: "disclaimer",
          type: "text",
          label: "Merknad",
          admin: {
            description:
              "Kort setning under kontaktlinjen, f.eks. om bruk av KI. La stå tom for å skjule.",
            placeholder:
              "Deler av nettsiden og noe innhold er laget med hjelp av KI.",
          },
        },
      ],
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
