import type { GlobalConfig } from "payload";

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: "Nettsted-innstillinger",
  admin: {
    group: "Innstillinger",
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Generelt",
          fields: [
            {
              name: "siteName",
              type: "text",
              required: true,
              label: "Nettstedsnavn",
              defaultValue: "Poynt",
            },
            {
              name: "siteDescription",
              type: "textarea",
              label: "Nettstedsbeskrivelse",
              admin: {
                description: "Brukes som standard meta description",
              },
            },
            {
              name: "logo",
              type: "upload",
              relationTo: "media",
              label: "Logo",
            },
            {
              name: "logoAlt",
              type: "upload",
              relationTo: "media",
              label: "Logo (lys variant)",
              admin: {
                description: "Brukes på mørk bakgrunn",
              },
            },
            {
              name: "favicon",
              type: "upload",
              relationTo: "media",
              label: "Favicon",
            },
          ],
        },
        {
          label: "Kontakt",
          fields: [
            {
              name: "email",
              type: "email",
              label: "E-post",
            },
            {
              name: "phone",
              type: "text",
              label: "Telefon",
            },
            {
              name: "address",
              type: "textarea",
              label: "Adresse",
            },
          ],
        },
        {
          label: "Sosiale medier",
          fields: [
            {
              name: "socialLinks",
              type: "array",
              label: "Sosiale medier",
              fields: [
                {
                  name: "platform",
                  type: "select",
                  required: true,
                  options: [
                    { label: "Facebook", value: "facebook" },
                    { label: "Instagram", value: "instagram" },
                    { label: "LinkedIn", value: "linkedin" },
                    { label: "Twitter/X", value: "twitter" },
                    { label: "YouTube", value: "youtube" },
                    { label: "TikTok", value: "tiktok" },
                  ],
                  label: "Plattform",
                },
                {
                  name: "url",
                  type: "text",
                  required: true,
                  label: "URL",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
