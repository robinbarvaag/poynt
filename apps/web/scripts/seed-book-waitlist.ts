/**
 * Seeder ventelista for boka «Verdifull vekst»: skjemaet (form-builder) +
 * landingssida /verdifull-vekst. Idempotent: oppdaterer hvis den finnes,
 * ellers oppretter.
 *
 * Innsendinger havner i admin under «Skjemaer → Innsendinger». Hook-en i
 * payload.config kjenner igjen skjemaet på tittelen («Venteliste – …»), melder
 * på nyhetsbrevet når avkryssingsboksen er huket av, og sender bekreftelse via
 * Resend (se lib/waitlist.ts).
 *
 *   bun run --cwd apps/web payload run scripts/seed-book-waitlist.ts
 */
import config from "@payload-config";
import { getPayload } from "payload";
import { WAITLIST_FORM_TITLE } from "../lib/waitlist";
import { richText } from "./_lexical";

const BOOK_TITLE = "Verdifull vekst";

const formFields = [
  {
    blockType: "text",
    name: "navn",
    label: "Navn",
    required: true,
    width: 50,
  },
  {
    blockType: "email",
    name: "epost",
    label: "E-post",
    required: true,
    width: 50,
  },
  {
    // ÉTT samtykke som dekker hele greia: ventelista OG påfyllet underveis.
    // Ikke «meld deg på nyhetsbrevet» – det er en annen avtale, og ordet
    // «nyhetsbrev» får folk til å tenke reklame. Påkrevd, fordi det er dette
    // du sier ja til når du melder deg på. Aldri forhåndsavhaket (GDPR).
    blockType: "checkbox",
    name: "samtykke",
    label:
      "Ja, jeg vil stå på ventelista og få smakebiter fra boka og annet relevant påfyll om vekst fra Poynt. Jeg kan melde meg av når som helst.",
    required: true,
    defaultValue: false,
    width: 100,
  },
];

const faqItems = [
  {
    question: "Når kommer boka?",
    answer:
      "Den er under arbeid, og vi styrer mot 2027. Datoen er ikke spikret ennå – står du på ventelista, får du beskjed så snart den er det, og igjen når boka faktisk kan bestilles.",
  },
  {
    question: "Koster det noe å stå på ventelista?",
    answer:
      "Nei. Ventelista er gratis og uforpliktende. Du forhåndsbestiller ingenting ved å melde deg på.",
  },
  {
    question: "Hva bruker dere e-postadressen min til?",
    answer:
      "Til å si fra om boka. Krysser du av for nyhetsbrevet, får du i tillegg noen e-poster om vekst og markedsføring. Du kan melde deg av når som helst, og adressen din deles aldri med andre.",
  },
  {
    question: "Hvem er boka for?",
    answer:
      "Deg som driver noe selv, eller som har ansvar for at en bedrift skal vokse – og som er lei av vekstråd som bare fungerer for selskaper med et helt markedsteam i ryggen.",
  },
];

const payload = await getPayload({ config });

// 1) Venteliste-skjemaet (upsert på tittel)
const existingForm = await payload.find({
  collection: "forms",
  where: { title: { equals: WAITLIST_FORM_TITLE } },
  limit: 1,
  depth: 0,
});

const formData = {
  title: WAITLIST_FORM_TITLE,
  fields: formFields,
  submitButtonLabel: "Sett meg på ventelista",
  confirmationType: "message",
  confirmationMessage: richText(
    "Du står på lista! Jeg sender deg en e-post så snart boka er klar – ikke oftere."
  ),
};

let formId: string | number;
if (existingForm.docs.length > 0) {
  formId = existingForm.docs[0].id;
  await payload.update({
    collection: "forms",
    id: formId,
    // biome-ignore lint/suspicious/noExplicitAny: seed-data matcher form-builder-skjemaet
    data: formData as any,
  });
  payload.logger.info(`Oppdaterte skjema: ${WAITLIST_FORM_TITLE}`);
} else {
  const created = await payload.create({
    collection: "forms",
    // biome-ignore lint/suspicious/noExplicitAny: seed-data matcher form-builder-skjemaet
    data: formData as any,
  });
  formId = created.id;
  payload.logger.info(`Opprettet skjema: ${WAITLIST_FORM_TITLE}`);
}

// 2) Landingssida (upsert på slug)
const page = {
  title: BOOK_TITLE,
  slug: "verdifull-vekst",
  pageType: "landing",
  meta: {
    title: `${BOOK_TITLE} – ny bok`,
    description:
      "Meld deg på ventelista for «Verdifull vekst» – boka om å vokse på en måte som faktisk er verdt noe. Du får beskjed først når den kommer.",
  },
  layout: [
    {
      blockType: "bookHero",
      // Blokk-navnet blir #anker, så CTA-en nederst kan hoppe hit.
      blockName: "Venteliste",
      badge: "Kommer i 2027",
      eyebrow: "Ny bok",
      title: BOOK_TITLE,
      subtitle:
        "En bok om å bygge noe som vokser – uten at det koster deg helga, marginene og gnisten. Meld deg på ventelista, så er du blant de første som får vite når den er klar.",
      bullets: [
        { text: "Vekst som holder, ikke bare vokser" },
        { text: "Konkrete grep, ikke luftige modeller" },
        { text: "Skrevet for små og mellomstore bedrifter" },
        { text: "Norske eksempler du kjenner igjen" },
      ],
      // Bokas ekte kapitler – de staver ut VEKST. Kortet leser forbokstaven fra
      // kapittelnavnet, så akrostikonet kan ikke komme ut av synk om navnene
      // endres. NB: «KI» (ikke «AI») er bokas eget ordvalg, jf. omslaget
      // «Forstå KI, salg og markedsføring».
      chapters: [
        {
          title: "Visjon",
          text: "Hvor er du på vei?",
        },
        {
          title: "Endring",
          text: "Hva bør endres for å komme deg dit?",
        },
        {
          title: "Kunder og KI",
          text: "Hvor godt kjenner du kundene dine? Og hvordan kan du bruke kunstig intelligens i bedriften din?",
        },
        {
          title: "Salg",
          text: "Hvordan skaper du omsetning?",
        },
        {
          title: "Tall",
          text: "Teller du de riktige tingene?",
        },
      ],
      form: formId,
      // Gjentar bevisst ikke «meld deg av når du vil» – det står i samtykket.
      note: "Gratis, og ingen kjøpeplikt når boka kommer.",
    },
    // Bevisst tynn side: heroen er handlinga, featureGrid forteller hva boka
    // ER, FAQ tar innvendingene, og CTA-en nederst er ÉN påminnelse. Nedtelling
    // og tekstbånd ble kuttet — de gjentok heroen. Blokkene finnes fortsatt i
    // blokkvelgeren: sett inn nedtellinga når lanseringsdatoen er ekte og nær.
    {
      blockType: "featureGrid",
      eyebrow: "Om boka",
      title: "Tre spørsmål boka svarer på",
      intro:
        "Ikke vekst for vekstens skyld – men vekst som gjør bedriften bedre å eie, jobbe i og kjøpe fra.",
      columns: "3",
      features: [
        {
          title: "Hva er egentlig verdifull vekst?",
          text: "Forskjellen på omsetning som ser fin ut i regnskapet og vekst som faktisk gjør bedriften sterkere.",
        },
        {
          title: "Hvor kommer den neste kunden fra?",
          text: "Hvordan du finner kanalene som virker for akkurat din bedrift, i stedet for å gjøre litt av alt.",
        },
        {
          title: "Hva sier du nei til?",
          text: "Vekst handler like mye om hva du lar være. Boka gir deg et språk for å velge bort.",
        },
      ],
    },
    {
      blockType: "faq",
      eyebrow: "Spørsmål",
      title: "Det folk lurer på",
      items: faqItems,
    },
    {
      blockType: "ctaSection",
      variant: "colored",
      title: "Vil du vite når boka kommer?",
      description:
        "Sett deg på ventelista, så sier jeg fra. Ingen forpliktelser, ingen kjøpepress.",
      primaryCta: { text: "Meld deg på ventelista", url: "#venteliste" },
    },
  ],
  faq: faqItems,
};

const existingPage = await payload.find({
  collection: "pages",
  where: { slug: { equals: page.slug } },
  limit: 1,
  depth: 0,
});

if (existingPage.docs.length > 0) {
  await payload.update({
    collection: "pages",
    id: existingPage.docs[0].id,
    // biome-ignore lint/suspicious/noExplicitAny: seed-data matcher blokk-skjemaet
    data: { ...page, _status: "published" } as any,
  });
  payload.logger.info("Oppdaterte side: /verdifull-vekst");
} else {
  await payload.create({
    collection: "pages",
    // biome-ignore lint/suspicious/noExplicitAny: seed-data matcher blokk-skjemaet
    data: { ...page, _status: "published" } as any,
  });
  payload.logger.info("Opprettet side: /verdifull-vekst");
}

payload.logger.info(
  "Ferdig med å seede venteliste-skjema + /verdifull-vekst. Husk å laste opp bokomslaget i bok-heroen."
);
process.exit(0);
