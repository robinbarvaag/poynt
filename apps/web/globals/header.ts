import type { GlobalConfig } from "payload";
import { navLinkFields } from "../fields/nav-link";

export const Header: GlobalConfig = {
  slug: "header",
  label: "Navigasjon",
  admin: {
    group: "Sideoppsett",
  },
  fields: [
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
          type: "row",
          fields: [
            {
              name: "text",
              type: "text",
              label: "Knappetekst",
              defaultValue: "Ta kontakt",
            },
            {
              name: "url",
              type: "text",
              label: "Lenke",
              defaultValue: "/kontakt",
            },
          ],
        },
      ],
    },
    {
      name: "navItems",
      type: "array",
      label: "Hovedmeny",
      maxRows: 8,
      admin: {
        initCollapsed: true,
        description:
          "Bruk undermenypunkter for å samle relaterte sider under hvert hovedpunkt.",
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
        ...navLinkFields(),
        {
          name: "subItems",
          type: "array",
          label: "Undermenypunkter",
          maxRows: 6,
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
              name: "description",
              type: "text",
              label: "Beskrivelse",
            },
            ...navLinkFields(),
          ],
        },
      ],
    },
  ],
};
