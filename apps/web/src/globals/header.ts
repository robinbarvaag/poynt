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
          type: "select",
          defaultValue: "custom",
          options: [
            { label: "Egendefinert URL", value: "custom" },
            { label: "CMS-side", value: "page" },
            { label: "Blogginnlegg", value: "blog" },
            { label: "Produkt", value: "product" },
          ],
          label: "Lenketype",
          admin: {
            description: "Velg type lenke. Bruk 'Egendefinert URL' for /blogg, /produkter eller eksterne lenker.",
          },
        },
        {
          name: "url",
          type: "text",
          label: "URL",
          admin: {
            condition: (_, siblingData) => siblingData?.linkType === "custom",
            description: "F.eks. /blogg, /produkter, eller https://ekstern-side.no",
          },
        },
        {
          name: "page",
          type: "relationship",
          relationTo: "pages",
          label: "Velg side",
          admin: {
            condition: (_, siblingData) => siblingData?.linkType === "page",
          },
        },
        {
          name: "blogPost",
          type: "relationship",
          relationTo: "blog-posts",
          label: "Velg blogginnlegg",
          admin: {
            condition: (_, siblingData) => siblingData?.linkType === "blog",
          },
        },
        {
          name: "product",
          type: "relationship",
          relationTo: "products",
          label: "Velg produkt",
          admin: {
            condition: (_, siblingData) => siblingData?.linkType === "product",
          },
        },
        {
          name: "openInNewTab",
          type: "checkbox",
          label: "Åpne i ny fane",
          defaultValue: false,
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
              type: "select",
              defaultValue: "custom",
              options: [
                { label: "Egendefinert URL", value: "custom" },
                { label: "CMS-side", value: "page" },
                { label: "Blogginnlegg", value: "blog" },
                { label: "Produkt", value: "product" },
              ],
              label: "Lenketype",
            },
            {
              name: "url",
              type: "text",
              label: "URL",
              admin: {
                condition: (_, siblingData) => siblingData?.linkType === "custom",
              },
            },
            {
              name: "page",
              type: "relationship",
              relationTo: "pages",
              label: "Velg side",
              admin: {
                condition: (_, siblingData) => siblingData?.linkType === "page",
              },
            },
            {
              name: "blogPost",
              type: "relationship",
              relationTo: "blog-posts",
              label: "Velg blogginnlegg",
              admin: {
                condition: (_, siblingData) => siblingData?.linkType === "blog",
              },
            },
            {
              name: "product",
              type: "relationship",
              relationTo: "products",
              label: "Velg produkt",
              admin: {
                condition: (_, siblingData) => siblingData?.linkType === "product",
              },
            },
            {
              name: "openInNewTab",
              type: "checkbox",
              label: "Åpne i ny fane",
              defaultValue: false,
            },
          ],
        },
      ],
    },
  ],
};
