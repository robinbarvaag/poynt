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
 * Admin-redigerte maltekster (fra «E-postmaler» i Payload), med flettefelt
 * som fylles med eksempeldata i forhåndsvisningen.
 */
export type PreviewTemplateOverrides = Record<
  string,
  { subject?: string; bodyHtml?: string }
>;

/** Eksempeldata for {{flettefelt}} i forhåndsvisningen. */
const SAMPLE_WILDCARDS: Record<string, string> = {
  navn: "Kari Nordmann",
  epost: "kari@eksempel.no",
  telefon: "912 34 567",
  gjelder: "Synlighetspakken",
  melding:
    "Hei! Vi vurderer å ta en synlighetspakke for bedriften vår. Kan dere si litt mer om hva som inngår?",
  kilde: "tjeneste:synlighet",
  type: "Produktsalg",
  ordrenummer: "1042",
  sum: "1339",
  betaling: "Vipps",
  nivå: "Community + AI",
  niva: "Community + AI",
  minutter: "10",
};

/** Fyll flettefelt med eksempeldata; ukjente felt vises som «(feltnavn)». */
function fillSample(text: string): string {
  return text.replace(/\{\{(.+?)\}\}/g, (_, raw: string) => {
    const key = raw.trim().toLowerCase();
    return SAMPLE_WILDCARDS[key] ?? `(${raw.trim()})`;
  });
}

const TEMPLATES_EDIT_HINT = {
  label: "Rediger teksten under E-postmaler",
  href: "/admin/collections/email-templates",
};

/**
 * Render alle e-postmalene med eksempeldata, til bruk i admin-forhåndsvisningen.
 * `orderContent`/`orderSubject` lar kallere vise de faktiske admin-redigerte
 * tekstene fra «Kasse og kvittering», og `templates` de admin-redigerte
 * maltekstene fra «E-postmaler» — da viser galleriet det som faktisk sendes.
 */
export async function renderEmailPreviews(options?: {
  orderSubject?: string;
  orderContent?: OrderConfirmationContent;
  templates?: PreviewTemplateOverrides;
}): Promise<EmailPreview[]> {
  const { render } = await import("@react-email/render");
  const [
    { default: OrderConfirmationEmail },
    { default: SaleNotificationEmail },
    { default: NewsletterSignupNotificationEmail },
    { default: ContactNotificationEmail },
    { default: ContactConfirmationEmail },
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
    import("./templates/newsletter"),
    import("./templates/magic-link"),
    import("./templates/welcome-member"),
    import("./templates/password-reset"),
  ]);

  const tpl = (key: string) => {
    const override = options?.templates?.[key];
    return {
      subject: override?.subject ? fillSample(override.subject) : undefined,
      contentHtml: override?.bodyHtml
        ? fillSample(override.bodyHtml)
        : undefined,
    };
  };

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
      subject:
        tpl("contact-confirmation").subject ||
        "Takk for din henvendelse – Poynt",
      to: "Avsenderen",
      editHint: TEMPLATES_EDIT_HINT,
      html: await render(
        ContactConfirmationEmail({
          name: "Kari Nordmann",
          message:
            "Hei! Vi vurderer å ta en synlighetspakke for bedriften vår. Kan dere si litt mer om hva som inngår?",
          contentHtml: tpl("contact-confirmation").contentHtml,
        })
      ),
    },
    {
      key: "newsletter",
      label: "Nyhetsbrev",
      group: "Til kunden",
      description:
        "Ramma rundt nyhetsbrevet — dette er bare et eksempel. Selve innholdet skriver du under Nyhetsbrev, der «Forhåndsvisning»-fanen viser akkurat ditt nyhetsbrev mens du skriver.",
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
      subject:
        tpl("sale-notification").subject || "Produktsalg: 1339 kr (#1042)",
      to: "Dere (varslingsadressene)",
      editHint: TEMPLATES_EDIT_HINT,
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
          introHtml: tpl("sale-notification").contentHtml,
        })
      ),
    },
    {
      key: "newsletter-signup-notification",
      label: "Nyhetsbrev-påmelding",
      group: "Interne varsler (til dere)",
      description:
        "Sendes til varslingsadressene (Nettsted-innstillinger → Kontakt) når noen melder seg på nyhetsbrevet via skjemaet på nettsiden.",
      subject:
        tpl("newsletter-signup-notification").subject ||
        "Ny på nyhetsbrevet: kari@eksempel.no",
      to: "Dere (varslingsadressene)",
      editHint: TEMPLATES_EDIT_HINT,
      html: await render(
        NewsletterSignupNotificationEmail({
          email: "kari@eksempel.no",
          source: "nyhetsbrev-skjema",
          introHtml: tpl("newsletter-signup-notification").contentHtml,
        })
      ),
    },
    {
      key: "contact-notification",
      label: "Kontakt-varsel",
      group: "Interne varsler (til dere)",
      description:
        "Sendes til varslingsadressene (Nettsted-innstillinger → Kontakt) når noen sender inn kontaktskjemaet. Brukes også som varsel ved venteliste-påmeldinger.",
      subject:
        tpl("contact-notification").subject ||
        "Ny henvendelse fra Kari Nordmann",
      to: "Dere (varslingsadressene)",
      editHint: TEMPLATES_EDIT_HINT,
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
          introHtml: tpl("contact-notification").contentHtml,
        })
      ),
    },
    {
      key: "welcome-member",
      label: "Velkommen som medlem",
      group: "On Poynt",
      description:
        "Sendes til nye On Poynt-medlemmer rett etter at abonnementet er tegnet, med lenke til onboardingen.",
      subject: tpl("welcome-member").subject || "Velkommen til On Poynt!",
      to: "Det nye medlemmet",
      editHint: TEMPLATES_EDIT_HINT,
      html: await render(
        WelcomeMemberEmail({
          memberName: "Kari",
          tier: "Community + AI",
          onboardingUrl: "#",
          contentHtml: tpl("welcome-member").contentHtml,
        })
      ),
    },
    {
      key: "magic-link",
      label: "Innloggingslenke",
      group: "On Poynt",
      description:
        "Sendes når et medlem logger inn på On Poynt med e-post (magisk lenke). Lenken varer i ti minutter.",
      subject: tpl("magic-link").subject || "Logg inn på On Poynt",
      to: "Medlemmet",
      editHint: TEMPLATES_EDIT_HINT,
      html: await render(
        MagicLinkEmail({
          url: "#",
          expiresInMinutes: 10,
          contentHtml: tpl("magic-link").contentHtml,
        })
      ),
    },
    {
      key: "password-reset",
      label: "Tilbakestill passord",
      group: "On Poynt",
      description:
        "Sendes til admin-brukere som ber om nytt passord til Payload-admin.",
      subject: tpl("password-reset").subject || "Tilbakestill passordet ditt",
      to: "Admin-brukeren",
      editHint: TEMPLATES_EDIT_HINT,
      html: await render(
        PasswordResetEmail({
          url: "#",
          name: "Robin",
          contentHtml: tpl("password-reset").contentHtml,
        })
      ),
    },
  ];
}
