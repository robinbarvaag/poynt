import type { CollectionConfig } from "payload";
import { NEWSLETTER_CONSENT_SOURCES } from "../lib/newsletter-consent-texts";

/**
 * Samtykkelogg for nyhetsbrev (GDPR art. 7 nr. 1 — vi må kunne vise at
 * samtykket er gitt). Én rad per påmelding: hvem, når, hvor og nøyaktig
 * hvilken tekst de sa ja til. Skrives kun av serveren via
 * lib/newsletter-consent.ts; avmelding skjer i Resend.
 */
export const NewsletterConsents: CollectionConfig = {
  slug: "newsletter-consents",
  labels: {
    singular: "Samtykke (nyhetsbrev)",
    plural: "Samtykker (nyhetsbrev)",
  },
  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "source", "createdAt"],
    group: "Kommunikasjon",
    description:
      "Registreres automatisk ved hver påmelding til nyhetsbrevet. Dokumenterer samtykket — ikke rediger. Avmeldinger håndteres i Resend. Ved krav om sletting: slett radene for e-posten her og kontakten i Resend.",
  },
  access: {
    create: () => false,
    read: ({ req: { user } }) => !!user,
    update: () => false,
    delete: ({ req: { user } }) => !!user,
  },
  timestamps: true,
  fields: [
    {
      name: "email",
      type: "email",
      required: true,
      index: true,
      label: "E-post",
    },
    {
      name: "source",
      type: "select",
      required: true,
      label: "Kilde",
      options: NEWSLETTER_CONSENT_SOURCES.map((s) => ({
        label: s.label,
        value: s.value,
      })),
    },
    {
      name: "consentText",
      type: "textarea",
      required: true,
      label: "Samtykketekst",
      admin: {
        description: "Teksten brukeren så og sa ja til.",
      },
    },
    {
      name: "path",
      type: "text",
      label: "Side",
      admin: { description: "Hvor på nettstedet påmeldingen skjedde." },
    },
    {
      name: "reference",
      type: "text",
      label: "Referanse",
      admin: {
        description: "F.eks. ordre-ID, boktilgang-ID eller skjema-ID.",
      },
    },
    {
      name: "subscribed",
      type: "checkbox",
      label: "Registrert i Resend",
      defaultValue: false,
      admin: {
        position: "sidebar",
        description:
          "Av = samtykket ble gitt, men påmeldingen i Resend feilet (se server-loggen).",
      },
    },
  ],
};
