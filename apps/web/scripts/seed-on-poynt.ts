/**
 * Seeder den OFFENTLIGE salgssiden for On Poynt-medlemskapet på /on-poynt.
 * Ruta eies av (frontend)/[...slug] (den gamle statiske planner-landingssiden
 * er slettet), så siden får vanlig site-header/footer og indekseres — kun
 * undersidene (/on-poynt/…) er medlemsområde, jf. robots.ts. Idempotent:
 * oppdaterer hvis slug finnes. Norsk utkast-tekst — finpuss i admin.
 *
 *   bun run --cwd apps/web payload run scripts/seed-on-poynt.ts
 */
import config from "@payload-config";
import { getPayload } from "payload";

// Én kilde for FAQ: rendres synlig (faq-blokk) OG publiseres som
// FAQPage-JSON-LD (seoFaqField) — Google vil at strukturert data skal speile
// synlig innhold.
const faqItems = [
  {
    question: "Hva koster medlemskap i On Poynt?",
    answer:
      "Medlemskapet koster 2 000 kr per måned (eks. mva). Du søker først, og betalingen starter når medlemskapet er godkjent og satt opp.",
  },
  {
    question: "Hva får jeg som medlem?",
    answer:
      "AI-verktøy som er satt opp ferdig for deg (årsplanlegger, markedsplan, kanalveileder og flere), praktiske guider og kurs om markedsføring og AI, og et fellesskap av andre småbedrifter du kan sparre med.",
  },
  {
    question: "Hvem passer On Poynt for?",
    answer:
      "Små bedrifter og gründere som gjør markedsføringen selv – uten egen markedsavdeling. Innholdet er laget for deg som har begrenset tid og vil vite hva som faktisk virker.",
  },
  {
    question: "Må jeg kunne noe om AI fra før?",
    answer:
      "Nei. Verktøyene er satt opp ferdig, og guidene starter fra begynnelsen. Du trenger ikke å ha brukt AI før for å få utbytte av medlemskapet.",
  },
  {
    question: "Hvordan blir jeg medlem?",
    answer:
      "Du søker via skjemaet på /bli-medlem. Susanne ser på alle søknader selv, og du får tilgang så snart søknaden er godkjent og medlemskapet er satt opp.",
  },
];

const page = {
  title: "On Poynt",
  slug: "on-poynt",
  layout: [
    {
      blockType: "hero",
      title: "Medlemskapet for deg som er markedsavdelingen",
      subtitle:
        "On Poynt samler AI-verktøy, guider, kurs og et fellesskap av folk i samme båt – for deg som gjør markedsføringen selv i en liten bedrift.",
      tagsLabel: "For deg som er:",
      tags: [
        { label: "Gründer" },
        { label: "Daglig leder" },
        { label: "Alene om markedsføringen" },
      ],
      primaryCta: { text: "Søk om medlemskap", url: "/bli-medlem" },
      secondaryCta: { text: "Logg inn", url: "/on-poynt/innlogging" },
    },
    {
      blockType: "featureGrid",
      eyebrow: "Hva du får",
      title: "Alt på ett sted – klart til bruk",
      columns: "3",
      features: [
        {
          title: "AI-verktøy satt opp for deg",
          text: "Årsplanlegger, markedsplan, kanalveileder og flere – verktøy som tar deg fra blankt ark til ferdig plan, uten at du trenger å kunne AI fra før.",
          linkLabel: "Se verktøyene",
          linkUrl: "/verktoy",
        },
        {
          title: "Guider og kurs",
          text: "Praktiske guider om LinkedIn, Instagram, AI, søkeord og mer – skrevet for små bedrifter, ikke for markedsavdelinger med ti ansatte.",
        },
        {
          title: "Et fellesskap i samme båt",
          text: "Det kan være ensomt å sitte alene med markedsføringsansvaret. I fellesskapet sparrer du med andre som står i akkurat det samme.",
        },
      ],
    },
    // Fargepanel nr. 2 er den grønne CTA-en nederst — derfor salmon her, så
    // siden ikke får to like grønne paneler (og budsjettet på to holder).
    {
      blockType: "statsBand",
      layout: "band",
      variant: "salmon",
      eyebrow: "Hvem står bak",
      title: "Laget av én som har gjort det før",
      description:
        "On Poynt drives av Susanne Todnem – markedsfører, journalist og foredragsholder. Alt innhold bygger på det som faktisk virker for små bedrifter, ikke det som ser fint ut i en rapport.",
      cta: { text: "Bli kjent med Susanne", url: "/om" },
      stats: [
        { value: 19, suffix: "+", label: "år med markedsføring bak innholdet" },
        { value: 5, suffix: "+", label: "AI-verktøy klare til bruk" },
        { value: 14, suffix: "+", label: "guider og ressurser" },
      ],
    },
    {
      // Kundehistorie som bevis der kjøpsbeslutningen tas. Bildet legges på i
      // admin (ekte foto fra Hageland). Historien bor i case-studies-
      // collectionen (jf. seed-kundehistorier.ts).
      blockType: "contentMedia",
      eyebrow: "Kundehistorie",
      title: "Hageland Edens Have nådde målene sine med On Poynt",
      body: "Fra usikker på sosiale medier til en plan som faktisk ble fulgt. Les hvordan et lokalt hagesenter brukte medlemskapet til å nå målene sine.",
      ctaText: "Les hele historien",
      ctaUrl:
        "/kundehistorier/hageland-edens-have-nadde-malene-sine-med-on-poynt",
      mediaSide: "right",
      accent: "mint",
    },
    {
      blockType: "steps",
      eyebrow: "Slik fungerer det",
      title: "Fra søknad til i gang – i tre steg",
      steps: [
        {
          title: "Søk om medlemskap",
          text: "Fyll ut søknaden – det tar noen minutter. Jeg ser på alle søknader selv.",
        },
        {
          title: "Vi setter opp for deg",
          text: "Når søknaden er godkjent, gjør vi klar tilgangen din – verktøy og innhold tilpasset bedriften din.",
        },
        {
          title: "I gang fra dag én",
          text: "Logg inn, følg stegene på oversikten, og lag din første plan samme uke.",
        },
      ],
    },
    {
      blockType: "faq",
      eyebrow: "Spørsmål og svar",
      title: "Lurer du på noe?",
      items: faqItems.map(({ question, answer }) => ({ question, answer })),
    },
    {
      blockType: "ctaSection",
      variant: "colored",
      title: "Klar til å slippe å stå alene med det?",
      description:
        "Medlemskapet koster 2 000 kr i måneden (eks. mva). Søk i dag, så hører du fra meg så snart søknaden er behandlet.",
      primaryCta: { text: "Søk om medlemskap", url: "/bli-medlem" },
      secondaryCta: { text: "Lurer du på noe? Ta en prat", url: "/kontakt" },
    },
  ],
  // Samme spørsmål som faq-blokka — publiseres som FAQPage-JSON-LD.
  faq: faqItems,
  meta: {
    title: "On Poynt – medlemskap i markedsføring og AI",
    description:
      "AI-verktøy, guider, kurs og fellesskap for små bedrifter som gjør markedsføringen selv. 2 000 kr/mnd.",
  },
};

const payload = await getPayload({ config });

const existing = await payload.find({
  collection: "pages",
  where: { slug: { equals: page.slug } },
  limit: 1,
  depth: 0,
});

if (existing.docs.length > 0) {
  await payload.update({
    collection: "pages",
    id: existing.docs[0].id,
    // biome-ignore lint/suspicious/noExplicitAny: seed-data matcher blokk-skjemaet
    data: { ...page, _status: "published" } as any,
  });
  payload.logger.info(`Oppdaterte side: /${page.slug}`);
} else {
  await payload.create({
    collection: "pages",
    // biome-ignore lint/suspicious/noExplicitAny: seed-data matcher blokk-skjemaet
    data: { ...page, _status: "published" } as any,
  });
  payload.logger.info(`Opprettet side: /${page.slug}`);
}

payload.logger.info("Ferdig med å seede /on-poynt-salgssiden.");
process.exit(0);
