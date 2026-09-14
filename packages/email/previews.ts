import type {
  OrderConfirmationContent,
  OrderConfirmationLegal,
  OrderConfirmationSeller,
} from "./templates/order-confirmation";

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

/**
 * Plassholder for QR-koden i forhåndsvisningen (ekte e-post bruker et
 * innebygd PNG-vedlegg, som ikke kan vises i admin-iframen).
 */
const SAMPLE_QR_SRC = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21" shape-rendering="crispEdges"><rect width="21" height="21" fill="#fff"/><path fill="#004029" d="M0 0h7v7H0zM1 1v5h5V1zM2 2h3v3H2zM14 0h7v7h-7zm1 1v5h5V1zm1 1h3v3h-3zM0 14h7v7H0zm1 1v5h5v-5zm1 1h3v3H2zM9 1h1v2H9zm2 1h2v1h-2zM8 4h2v2H8zm3 1h1v3h-1zM9 8h3v1H9zM0 9h2v1H0zm3 0h3v2H3zm11 0h2v1h-2zm3 0h4v1h-4zM8 10h1v3H8zm4 1h3v1h-3zm4 1h2v2h-2zm3 0h2v1h-2zM9 14h2v2H9zm3 1h1v3h-1zm2-1h3v1h-3zm-5 3h2v3H9zm6 0h2v2h-2zm3 1h3v1h-3zm-4 2h1v1h-1zm4 0h3v1h-3z"/></svg>'
)}`;

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
  /** Faktiske selgeropplysninger fra «Nettbutikk» — ellers eksempeldata. */
  orderSeller?: OrderConfirmationSeller;
  orderLegal?: OrderConfirmationLegal;
  /** Om eksempelordren skal vises med PDF-vedlegg (default: ja). */
  orderHasAttachments?: boolean;
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
    { default: EventTicketEmail },
    { default: EventWaitlistedEmail },
    { default: EventCancelledEmail },
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
    import("./templates/event-ticket"),
    import("./templates/event-waitlisted"),
    import("./templates/event-cancelled"),
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
    { name: "Verdifull vekst (e-bok)", quantity: 1, price: 349, vatRate: 25 },
    { name: "Synlighetspakken", quantity: 1, price: 990, vatRate: 25 },
  ];
  const sampleSeller: OrderConfirmationSeller = options?.orderSeller ?? {
    name: "Poynt AS",
    orgNumber: "123 456 789",
    vatRegistered: true,
    address: "Eksempelveien 1\n4000 Stavanger",
    supportEmail: "hei@poynt.no",
  };
  const sampleLegal: OrderConfirmationLegal = options?.orderLegal ?? {
    withdrawalNotice:
      "Digitalt innhold leveres umiddelbart etter kjøp. Ved å fullføre kjøpet ba du om at leveringen startet med en gang, og du godtok at angreretten dermed bortfaller (angrerettloven § 22 bokstav n).",
    termsUrl: "https://www.poynt.no/kjopsbetingelser",
    privacyUrl: "https://www.poynt.no/personvern",
  };

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
          customerEmail: "kari@example.com",
          paymentMethod: "Vipps",
          items: sampleItems,
          total: 1339,
          content: options?.orderContent,
          seller: sampleSeller,
          legal: sampleLegal,
          hasAttachments: options?.orderHasAttachments ?? true,
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
      key: "event-ticket",
      label: "Event: billett",
      group: "Eventer",
      description:
        "Sendes når noen melder seg på et event (eller rykker opp fra ventelista). Har eventet «Send kode og QR-kode» på, får de koden og QR-koden de viser i døra. Kalenderfil legges ved. Egen hilsen og praktisk info skriver du på eventet.",
      subject: "Billetten din: Lanseringsfest for «Verdifull vekst»",
      to: "Den påmeldte",
      editHint: {
        label: "Skriv hilsen og praktisk info på eventet",
        href: "/admin/collections/events",
      },
      html: await render(
        EventTicketEmail({
          name: "Kari",
          eventTitle: "Lanseringsfest for «Verdifull vekst»",
          when: "torsdag 15. oktober 2026, kl. 18:00–21:00",
          where: "Eksempelstedet, Eksempelveien 1, 4000 Stavanger",
          mapUrl: "#",
          doorsOpen: "Dørene åpner kl. 17:30",
          code: "POY-7K3M",
          qrSrc: SAMPLE_QR_SRC,
          ticketUrl: "#",
          greeting: "Så gøy at du kommer! Boka er klar, og det er kaken også.",
          practicalInfo: [
            "Det er gratis parkering rett ved inngangen.",
            "Si fra i påmeldingen hvis du har allergier.",
          ],
        })
      ),
    },
    {
      key: "event-reminder",
      label: "Event: påminnelse",
      group: "Eventer",
      description:
        "Sendes automatisk til alle med plass omtrent et døgn før eventet, med billetten og praktisk info. Den som meldte seg på det siste døgnet, får ingen påminnelse.",
      subject: "Snart er det tid: Lanseringsfest for «Verdifull vekst»",
      to: "Den påmeldte",
      editHint: {
        label: "Skriv praktisk info på eventet",
        href: "/admin/collections/events",
      },
      html: await render(
        EventTicketEmail({
          name: "Kari",
          eventTitle: "Lanseringsfest for «Verdifull vekst»",
          when: "torsdag 15. oktober 2026, kl. 18:00–21:00",
          where: "Eksempelstedet, Eksempelveien 1, 4000 Stavanger",
          mapUrl: "#",
          doorsOpen: "Dørene åpner kl. 17:30",
          code: "POY-7K3M",
          qrSrc: SAMPLE_QR_SRC,
          ticketUrl: "#",
          practicalInfo: ["Det er gratis parkering rett ved inngangen."],
          reminder: true,
        })
      ),
    },
    {
      key: "event-waitlisted",
      label: "Event: venteliste",
      group: "Eventer",
      description:
        "Sendes når noen melder seg på et event som er fullt og har venteliste. Får de plass, sendes billetten automatisk.",
      subject: "Du står på ventelista: Lanseringsfest for «Verdifull vekst»",
      to: "Den påmeldte",
      html: await render(
        EventWaitlistedEmail({
          name: "Kari",
          eventTitle: "Lanseringsfest for «Verdifull vekst»",
          when: "torsdag 15. oktober 2026, kl. 18:00–21:00",
          where: "Eksempelstedet, Stavanger",
          position: 3,
          ticketUrl: "#",
        })
      ),
    },
    {
      key: "event-cancelled",
      label: "Event: avmeldt",
      group: "Eventer",
      description:
        "Kvittering når noen melder seg av på billettsiden, eller når dere melder dem av fra «Påmeldte»-fanen.",
      subject: "Du er meldt av: Lanseringsfest for «Verdifull vekst»",
      to: "Den som meldte seg av",
      html: await render(
        EventCancelledEmail({
          name: "Kari",
          eventTitle: "Lanseringsfest for «Verdifull vekst»",
          when: "torsdag 15. oktober 2026, kl. 18:00–21:00",
          eventUrl: "#",
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
