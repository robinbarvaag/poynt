import type { GlobalConfig } from "payload";

export const Header: GlobalConfig = {
  slug: "header",
  label: "Navigasjon",
  admin: {
    group: "Innstillinger",
  },
  fields: [
    {
      name: "showSearch",
      type: "checkbox",
      defaultValue: true,
      label: "Vis søkefelt",
    },
    {
      name: "showLogin",
      type: "checkbox",
      defaultValue: true,
      label: "Vis logg inn-knapp",
    },
    {
      name: "ctaButton",
      type: "group",
      label: "CTA-knapp",
      fields: [
        {
          name: "show",
          type: "checkbox",
          defaultValue: true,
          label: "Vis CTA-knapp",
        },
        {
          name: "text",
          type: "text",
          label: "Knappetekst",
          defaultValue: "Kom i gang",
        },
        {
          name: "url",
          type: "text",
          label: "Lenke",
          defaultValue: "/kurs",
        },
      ],
    },
    {
      name: "navItems",
      type: "array",
      label: "Hovedmeny",
      maxRows: 8,
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
            condition: (_, siblingData) => siblingData?.linkType === "internal",
          },
        },
        {
          name: "url",
          type: "text",
          label: "URL",
          admin: {
            condition: (_, siblingData) => siblingData?.linkType === "external",
          },
        },
        {
          name: "subItems",
          type: "array",
          label: "Undermenypunkter",
          maxRows: 6,
          fields: [
            {
              name: "label",
              type: "text",
              required: true,
              label: "Lenketekst",
            },
            {
              name: "description",
              type: "text",
              label: "Beskrivelse",
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
                condition: (_, siblingData) => siblingData?.linkType === "internal",
              },
            },
            {
              name: "url",
              type: "text",
              label: "URL",
              admin: {
                condition: (_, siblingData) => siblingData?.linkType === "external",
              },
            },
          ],
        },
      ],
    },
  ],
};
