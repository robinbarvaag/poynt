import type { CollectionConfig } from "payload";

/**
 * Tekstene i e-postene nettsiden sender automatisk (bekreftelser, On
 * Poynt-e-poster og interne varsler). Fast sett med maler — seedet av
 * scripts/seed-email-templates.ts, kan ikke opprettes eller slettes i admin.
 * Send-funksjonene i @poynt/email slår opp malen via templateKey
 * (provider registrert i instrumentation.ts); er malen tom brukes
 * standardteksten i koden. Nyhetsbrev og skjema-e-poster redigeres der de
 * hører hjemme (Nyhetsbrev-collectionen og på hvert skjema); ordrebekreftelsen
 * i «Kasse og kvittering».
 */
export const EmailTemplates: CollectionConfig = {
  slug: "email-templates",
  labels: {
    singular: "E-postmal",
    plural: "E-postmaler",
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "subject"],
    group: "Kommunikasjon",
    description:
      "Tekstene i e-postene nettsiden sender automatisk. Endre teksten i «Innhold»-fanen og se resultatet i «Forhåndsvisning». Nyhetsbrev og skjema-e-poster redigeres på sitt eget sted — se oversikten under Drift → E-post.",
  },
  access: {
    // Fast sett — malene seedes og skal verken opprettes eller slettes i admin.
    create: () => false,
    delete: () => false,
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Innhold",
          fields: [
            {
              name: "subject",
              type: "text",
              label: "Emne",
              admin: {
                description:
                  "Emnefeltet mottakerne ser i innboksen. Kan bruke flettefelt, f.eks. {{navn}} — se «Slik virker malen» i sidemenyen.",
              },
            },
            {
              name: "body",
              type: "richText",
              label: "Innhold",
              admin: {
                description:
                  "Selve e-posten. Poynt-ramma (logo og farger) og eventuelle knapper/detaljer legges på automatisk.",
              },
            },
          ],
        },
        {
          label: "Forhåndsvisning",
          description:
            "E-posten slik den ser ut for mottakeren — oppdateres mens du skriver, med eksempeldata i flettefeltene.",
          fields: [
            {
              name: "previewPanel",
              type: "ui",
              admin: {
                components: {
                  Field:
                    "/admin/components/email-templates/email-template-preview#EmailTemplatePreview",
                },
              },
            },
          ],
        },
      ],
    },
    {
      name: "name",
      type: "text",
      required: true,
      label: "Navn",
      admin: {
        position: "sidebar",
        readOnly: true,
      },
    },
    {
      name: "templateKey",
      type: "text",
      required: true,
      unique: true,
      index: true,
      label: "Teknisk nøkkel",
      admin: {
        position: "sidebar",
        readOnly: true,
        description: "Kobler malen til utsendingen i koden — kan ikke endres.",
      },
    },
    {
      name: "hint",
      type: "textarea",
      label: "Slik virker malen",
      admin: {
        position: "sidebar",
        readOnly: true,
        description:
          "Hvilke flettefelt du kan bruke, og hva som legges på automatisk.",
      },
    },
  ],
};
