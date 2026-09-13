/**
 * Samtykketekstene brukeren faktisk ser når de melder seg på nyhetsbrevet.
 * Ligger ett sted så UI og samtykkeloggen (collection «newsletter-consents»)
 * alltid bruker samme ordlyd — endrer du teksten i UI-et, endres også det
 * som dokumenteres. Klient-trygg (ingen server-importer).
 */
export const NEWSLETTER_CONSENT_SOURCES = [
  { value: "newsletter-form", label: "Nyhetsbrevskjema (blokk/footer)" },
  { value: "book-access", label: "Boktilgang (QR-kodeside)" },
  { value: "checkout", label: "Handlekurv / utsjekk" },
  { value: "receipt", label: "Kvitteringsside" },
  { value: "membership", label: "Medlemskap" },
  { value: "waitlist", label: "Venteliste-skjema" },
] as const;

export type NewsletterConsentSource =
  (typeof NEWSLETTER_CONSENT_SOURCES)[number]["value"];

export const NEWSLETTER_CONSENT_TEXTS = {
  newsletterForm:
    "Påmelding til nyhetsbrev med tips om markedsføring, AI og kommunikasjon. Vi bruker e-posten kun til nyhetsbrevet, og du kan melde deg av når som helst.",
  bookAccess: "Send meg nye ressurser og tips på e-post",
  checkout:
    "Ja takk, jeg vil motta nyhetsbrev med tips og tilbud fra Poynt. Du kan melde deg av når som helst.",
  receipt:
    "Vil du ha tips og tilbud fra Poynt? Meld deg på nyhetsbrevet. Du kan melde deg av når som helst.",
  waitlist: "Avkrysning for venteliste/nyhetsbrev i skjemaet",
} as const;
