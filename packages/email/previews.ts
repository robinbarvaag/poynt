import type { OrderConfirmationContent } from "./templates/order-confirmation";

/** Én e-postmal, ferdig rendret med eksempeldata for forhåndsvisning i admin. */
export interface EmailPreview {
  key: string;
  label: string;
  /** Gruppering i visningen, f.eks. «Til kunden» / «Interne varsler». */
  group: string;
  /** Når og hvorfor e-posten sendes — lett hverdagsspråk. */
  description: string;
  /** Eksempel på emnefeltet slik det faktisk sendes. */
  subject: string;
  /** Hvem som mottar e-posten. */
  to: string;
  /** Ferdig rendret HTML (med eksempeldata). */
  html: string;
  /** Hvor tekstene kan redigeres, hvis de er redigerbare i admin. */
  editHint?: { label: string; href: string };
}

const SAMPLE_NEWSLETTER_HTML = `
  <h2>Tre ting vi har lært om synlighet</h2>
  <p>Hei! Her er et eksempel på hvordan et nyhetsbrev ser ut i Poynt-drakta.
  Selve innholdet skriver du i admin under Nyhetsbrev.</p>
  <ul>
    <li>Det enkle vinner — én tydelig beskjed per utsending.</li>
    <li>Skriv som du snakker.</li>
    <li>Send jevnlig, ikke perfekt.</li>
  </ul>
  <p>Ha en fin uke!</p>
`;

/**
 * Render alle e-postmalene med eksempeldata, til bruk i admin-forhåndsvisningen.
 * `orderContent`/`orderSubject` lar kallere vise de faktiske admin-redigerte
 * tekstene fra «Kasse og kvittering» i stedet for standardtekstene.
 */
export async function renderEmailPreviews(options?: {
  orderSubject?: string;
  orderContent?: OrderConfirmationContent;
}): Promise<EmailPreview[]> {
  const { render } = await import("@react-email/render");
  const [
    { default: OrderConfirmationEmail },
    { default: SaleNotificationEmail },
    { default: NewsletterSignupNotificationEmail },
    { default: ContactNotificationEmail },
    { default: ContactConfirmationEmail },
    { default: WaitlistConfirmationEmail },
    { default: NewsletterEmail },
    { default: MagicLinkEmail },
    { default: WelcomeMemberEmail },
    { default: PasswordResetEmail },
  ] = await Promise.all([
    import("./templates/order-confirmation"),
    import("./templates/sale-notification"),
    import("./templates/newsletter-signup-notification"),
    import("./templates/contact-notification"),
    import("./templates/contact-confirmation"),
    import("./templates/waitlist-confirmation"),
    import("./templates/newsletter"),
    import("./templates/magic-link"),
    import("./templates/welcome-member"),
    import("./templates/password-reset"),
  ]);

  const sampleItems = [
    { name: "Verdifull vekst (e-bok)", quantity: 1, price: 349 },
    { name: "Synlighetspakken", quantity: 1, price: 990 },
  ];

  return [
    {
      key: "order-confirmation",
      label: "Ordrebekreftelse",
      group: "Til kunden",
      description:
        "Sendes til kunden rett etter et kjøp i nettbutikken (Stripe og Vipps). Kjøpte PDF-er legges ved. Tekstene under kan du endre selv.",
      subject: `${options?.orderSubject || "Ordrebekreftelse"} #1042`,
      to: "Kunden",
      editHint: {
        label: "Rediger tekstene i «Kasse og kvittering»",
        href: "/admin/globals/checkout-settings",
      },
      html: await render(
        OrderConfirmationEmail({
          orderNumber: "1042",
          customerName: "Kari Nordmann",
          items: sampleItems,
          total: 1339,
          content: options?.orderContent,
          hasAttachments: true,
        })
      ),
    },
    {
      key: "contact-confirmation",
      label: "Kontakt-bekreftelse",
      group: "Til kunden",
      description:
        "Sendes til den som fyller ut kontaktskjemaet, som en kvittering på at meldingen er mottatt.",
      subject: "Takk for din henvendelse – Poynt",
      to: "Avsenderen",
      html: await render(
        ContactConfirmationEmail({
          name: "Kari Nordmann",
          message:
            "Hei! Vi vurderer å ta en synlighetspakke for bedriften vår. Kan dere si litt mer om hva som inngår?",
        })
      ),
    },
    {
      key: "waitlist-confirmation",
      label: "Venteliste-bekreftelse",
      group: "Til kunden",
      description:
        "Sendes til den som setter seg på ventelista for boka (skjemaet på landingssiden).",
      subject: "Du står på ventelista for «Verdifull vekst»",
      to: "Den påmeldte",
      html: await render(
        WaitlistConfirmationEmail({
          name: "Kari",
          title: "Verdifull vekst",
          newsletter: true,
        })
      ),
    },
    {
      key: "newsletter",
      label: "Nyhetsbrev",
      group: "Til kunden",
      description:
        "Ramma rundt nyhetsbrevet. Selve innholdet skriver du i admin under Nyhetsbrev — dette er bare et eksempel.",
      subject: "Tre ting vi har lært om synlighet",
      to: "Alle på nyhetsbrevlista",
      editHint: {
        label: "Skriv nyhetsbrev under Nyhetsbrev",
        href: "/admin/collections/newsletters",
      },
      html: await render(
        NewsletterEmail({
          preview: "Tre ting vi har lært om synlighet",
          contentHtml: SAMPLE_NEWSLETTER_HTML,
          unsubscribeUrl: "#",
        })
      ),
    },
    {
      key: "sale-notification",
      label: "Salgsvarsel",
      group: "Interne varsler (til dere)",
      description:
        "Sendes til varslingsadressene (Nettsted-innstillinger → Kontakt) hver gang noen kjøper noe i nettbutikken eller tegner et On Poynt-medlemskap.",
      subject: "Produktsalg: 1339 kr (#1042)",
      to: "Dere (varslingsadressene)",
      html: await render(
        SaleNotificationEmail({
          kind: "Produktsalg",
          orderNumber: "1042",
          customerName: "Kari Nordmann",
          customerEmail: "kari@eksempel.no",
          items: sampleItems,
          total: 1339,
          paymentProvider: "Vipps",
          adminUrl: "#",
        })
      ),
    },
    {
      key: "newsletter-signup-notification",
      label: "Nyhetsbrev-påmelding",
      group: "Interne varsler (til dere)",
      description:
        "Sendes til varslingsadressene (Nettsted-innstillinger → Kontakt) når noen melder seg på nyhetsbrevet via skjemaet på nettsiden.",
      subject: "Ny på nyhetsbrevet: kari@eksempel.no",
      to: "Dere (varslingsadressene)",
      html: await render(
        NewsletterSignupNotificationEmail({
          email: "kari@eksempel.no",
          source: "nyhetsbrev-skjema",
        })
      ),
    },
    {
      key: "contact-notification",
      label: "Kontakt-varsel",
      group: "Interne varsler (til dere)",
      description:
        "Sendes til varslingsadressene (Nettsted-innstillinger → Kontakt) når noen sender inn kontaktskjemaet. Brukes også som varsel ved venteliste-påmeldinger.",
      subject: "Ny henvendelse fra Kari Nordmann",
      to: "Dere (varslingsadressene)",
      html: await render(
        ContactNotificationEmail({
          name: "Kari Nordmann",
          email: "kari@eksempel.no",
          phone: "912 34 567",
          subject: "Synlighetspakken",
          message:
            "Hei! Vi vurderer å ta en synlighetspakke for bedriften vår. Kan dere si litt mer om hva som inngår?",
          source: "tjeneste:synlighet",
          sourcePath: "/tjenester/synlighet",
        })
      ),
    },
    {
      key: "welcome-member",
      label: "Velkommen som medlem",
      group: "On Poynt",
      description:
        "Sendes til nye On Poynt-medlemmer rett etter at abonnementet er tegnet, med lenke til onboardingen.",
      subject: "Velkommen til On Poynt!",
      to: "Det nye medlemmet",
      html: await render(
        WelcomeMemberEmail({
          memberName: "Kari",
          tier: "Community + AI",
          onboardingUrl: "#",
        })
      ),
    },
    {
      key: "magic-link",
      label: "Innloggingslenke",
      group: "On Poynt",
      description:
        "Sendes når et medlem logger inn på On Poynt med e-post (magisk lenke). Lenken varer i ti minutter.",
      subject: "Logg inn på On Poynt",
      to: "Medlemmet",
      html: await render(MagicLinkEmail({ url: "#", expiresInMinutes: 10 })),
    },
    {
      key: "password-reset",
      label: "Tilbakestill passord",
      group: "On Poynt",
      description:
        "Sendes til admin-brukere som ber om nytt passord til Payload-admin.",
      subject: "Tilbakestill passordet ditt",
      to: "Admin-brukeren",
      html: await render(PasswordResetEmail({ url: "#", name: "Robin" })),
    },
  ];
}
