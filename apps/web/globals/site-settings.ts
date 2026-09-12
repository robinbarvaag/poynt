import type { GlobalConfig } from "payload";
import { revalidateCmsAfterChange } from "../lib/revalidate-cms";

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: "Nettsted-innstillinger",
  admin: {
    // Ligger i den egenbygde «Drift»-nav-gruppen (setup-nav-group.tsx),
    // ikke i Payloads standard-nav.
    group: false,
  },
  hooks: {
    afterChange: [revalidateCmsAfterChange],
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
          label: "Delingsbilder",
          description:
            "Styrer de automatiske delingskortene (Open Graph-bilder) som lages når en side deles på sosiale medier og ikke har et delingsbilde i riktig format (1200×630).",
          fields: [
            {
              name: "ogLogo",
              type: "upload",
              relationTo: "media",
              label: "Logo på delingskort",
              admin: {
                description:
                  "Logoen som vises på delingskortene. Tom = logoen fra «Generelt»-fanen brukes.",
              },
            },
            {
              name: "ogCtaText",
              type: "text",
              label: "Handlingsoppfordring (CTA)",
              defaultValue: "Les mer på poynt.no",
              admin: {
                description: "Teksten i knappen på delingskortet.",
              },
            },
            {
              name: "ogStyle",
              type: "select",
              label: "Stil for kort med bilde",
              defaultValue: "overlay",
              options: [
                {
                  label: "Bilde i full bredde med tekst-overlay",
                  value: "overlay",
                },
                { label: "Tekst til venstre, bilde til høyre", value: "panel" },
              ],
              admin: {
                description:
                  "Gjelder foto-aktige bilder. Logoer og andre uvanlige formater vises alltid i panel-stil, slik at ingenting av bildet kuttes.",
              },
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
            {
              name: "notificationEmails",
              type: "text",
              label: "Varslings-e-poster",
              admin: {
                // Redigeres på E-post-siden (Drift → E-post) — skjult her så
                // det bare finnes ETT sted å lete.
                hidden: true,
              },
            },
          ],
        },
        {
          label: "Bedrift",
          description:
            "Fakta om bedriften som publiseres som strukturert data (JSON-LD) og i llms.txt. Hjelper Google og AI-tjenester (ChatGPT, Claude, Perplexity) å forstå hvem Poynt er. Tomme felt utelates.",
          fields: [
            {
              name: "company",
              type: "group",
              label: false,
              fields: [
                {
                  type: "row",
                  fields: [
                    {
                      name: "legalName",
                      type: "text",
                      label: "Juridisk navn",
                      admin: { placeholder: "Poynt AS", width: "50%" },
                    },
                    {
                      name: "orgNumber",
                      type: "text",
                      label: "Organisasjonsnummer",
                      admin: {
                        placeholder: "930 714 151",
                        width: "50%",
                        description:
                          "Kobler bedriften til Brønnøysundregistrene.",
                      },
                    },
                  ],
                },
                {
                  type: "row",
                  fields: [
                    {
                      name: "foundingDate",
                      type: "text",
                      label: "Etablert",
                      admin: {
                        placeholder: "2020 eller 2020-03-01",
                        width: "50%",
                      },
                    },
                    {
                      name: "areaServed",
                      type: "text",
                      label: "Område bedriften betjener",
                      defaultValue: "Norge",
                      admin: { width: "50%" },
                    },
                  ],
                },
                {
                  name: "slogan",
                  type: "text",
                  label: "Slagord",
                },
                {
                  name: "knowsAbout",
                  type: "array",
                  label: "Fagområder",
                  labels: { singular: "Fagområde", plural: "Fagområder" },
                  admin: {
                    description:
                      "Temaer bedriften er ekspert på, f.eks. «Markedsføring», «Kunstig intelligens», «LinkedIn».",
                  },
                  fields: [
                    {
                      name: "topic",
                      type: "text",
                      required: true,
                      label: "Fagområde",
                    },
                  ],
                },
                {
                  name: "founder",
                  type: "group",
                  label: "Grunnlegger / daglig leder",
                  admin: {
                    description:
                      "Personen bak bedriften. Styrker troverdigheten (E-E-A-T) i søk og AI-svar.",
                  },
                  fields: [
                    {
                      type: "row",
                      fields: [
                        {
                          name: "name",
                          type: "text",
                          label: "Navn",
                          admin: { width: "50%" },
                        },
                        {
                          name: "jobTitle",
                          type: "text",
                          label: "Tittel",
                          admin: {
                            placeholder: "Daglig leder og rådgiver",
                            width: "50%",
                          },
                        },
                      ],
                    },
                    {
                      name: "description",
                      type: "textarea",
                      label: "Kort bio",
                    },
                    {
                      name: "image",
                      type: "upload",
                      relationTo: "media",
                      label: "Portrett",
                    },
                    {
                      name: "sameAs",
                      type: "array",
                      label: "Profiler",
                      labels: { singular: "Profil", plural: "Profiler" },
                      admin: {
                        description:
                          "Lenker til personens egne profiler, f.eks. LinkedIn eller en Wikipedia-side.",
                      },
                      fields: [
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
                    { label: "Threads", value: "threads" },
                    { label: "Pinterest", value: "pinterest" },
                    { label: "Snapchat", value: "snapchat" },
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
            {
              name: "showSocialFab",
              type: "checkbox",
              defaultValue: true,
              label: "Vis flytende følg-oss-knapp",
              admin: {
                description:
                  "Liten knapp nede til høyre som slår ut kanalene. Skjuler seg selv når footeren er synlig.",
              },
            },
          ],
        },
      ],
    },
  ],
};
