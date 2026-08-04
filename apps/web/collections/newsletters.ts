import type { CollectionConfig } from "payload";

/**
 * Nyhetsbrev skrevet i Payload og sendt som Resend Broadcasts til audiencen
 * (RESEND_AUDIENCE_ID). Partneren skriver innholdet her, sender en test til seg
 * selv, og sender så til alle abonnenter via send-panelet i sidemenyen.
 * Selve utsendingen skjer i /api/newsletter-broadcast.
 */
export const Newsletters: CollectionConfig = {
  slug: "newsletters",
  labels: {
    singular: "Nyhetsbrev",
    plural: "Nyhetsbrev",
  },
  admin: {
    useAsTitle: "subject",
    defaultColumns: ["subject", "status", "sentAt"],
    group: "Kommunikasjon",
    description:
      "Skriv nyhetsbrevet her, send en test til deg selv, og send så til alle abonnenter.",
  },
  fields: [
    {
      // Fanene er kun visuelle (uten navn) — ingen endring i databasen.
      type: "tabs",
      tabs: [
        {
          label: "Innhold",
          fields: [
            {
              name: "subject",
              type: "text",
              required: true,
              label: "Emne",
              admin: {
                description: "Emnefeltet mottakerne ser i innboksen",
              },
            },
            {
              name: "previewText",
              type: "text",
              label: "Forhåndsvisningstekst",
              admin: {
                description:
                  "Kort tekst som vises etter emnet i innboksen (valgfritt — emnet brukes hvis tomt)",
              },
            },
            {
              name: "content",
              type: "richText",
              required: true,
              label: "Innhold",
            },
          ],
        },
        {
          label: "Forhåndsvisning",
          description:
            "E-posten slik den ser ut for mottakerne — oppdateres mens du skriver.",
          fields: [
            {
              name: "previewPanel",
              type: "ui",
              admin: {
                components: {
                  Field:
                    "/admin/components/newsletters/newsletter-preview#NewsletterPreview",
                },
              },
            },
          ],
        },
      ],
    },
    {
      name: "sendPanel",
      type: "ui",
      admin: {
        position: "sidebar",
        components: {
          Field:
            "/admin/components/newsletters/send-newsletter-panel#SendNewsletterPanel",
        },
      },
    },
    {
      name: "status",
      type: "select",
      label: "Status",
      defaultValue: "draft",
      options: [
        { label: "Utkast", value: "draft" },
        { label: "Sendt", value: "sent" },
      ],
      admin: {
        position: "sidebar",
        readOnly: true,
      },
    },
    {
      name: "sentAt",
      type: "date",
      label: "Sendt",
      admin: {
        position: "sidebar",
        readOnly: true,
        date: { displayFormat: "dd.MM.yyyy HH:mm" },
      },
    },
    {
      name: "broadcastId",
      type: "text",
      label: "Resend broadcast-ID",
      admin: {
        position: "sidebar",
        readOnly: true,
        condition: (data) => Boolean(data?.broadcastId),
      },
    },
  ],
};
