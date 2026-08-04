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

/** Kortformen — brukes i skjemanavn og e-postemne. */
const BOOK_TITLE = "Verdifull vekst";

/** Bokas fulle tittel slik den står i manuset. Manuset er alltid fasit. */
const BOOK_FULL_TITLE = "Verdifull vekst – i små bedrifter";

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
      "Boka kommer i høst. Står du på ventelista, hører du fra meg så snart den kan bestilles – før det går ut til alle andre.",
  },
  {
    question: "Hva handler boka om?",
    answer:
      "VEKST-modellen, som har gitt navn til kapitlene: V for visjon – hvor er du på vei? E for endring – hva bør endres for å komme deg dit? K for kunder og KI – hvor godt kjenner du kundene dine, og hvordan kan du bruke kunstig intelligens i bedriften din? S for salg – hvordan skaper du omsetning? T for tall – teller du de riktige tingene? Til slutt kommer et bonuskapittel om tankesett. Rekkefølgen er ikke tilfeldig – du må begynne i riktig ende av vekst.",
  },
  {
    question: "Hvem er boka for?",
    answer:
      "Til deg som er uredd nok til å starte eller drive en bedrift. Til deg som drømmer stort og driver lite. Til deg som tenker at du ikke kan jobbe flere timer i døgnet, men som vet at bedriften har større potensial – og til deg som har hundre gode ideer, men ikke vet hvor du skal starte.",
  },
  {
    question: "Hvem har skrevet den?",
    answer:
      "Susanne Todnem, gründer gjennom ti år. Hun har drevet markedsføringsbyrå med ansatte og kunder i fem land, vært investor og styremedlem, ni-doblet omsetningen sin – og hatt fri hver eneste fredag i ti år. Boka er alt hun skulle ønske hun selv visste da hun startet.",
  },
  {
    question: "Koster det noe å stå på ventelista?",
    answer:
      "Nei. Ventelista er gratis og uforpliktende. Du forhåndsbestiller ingenting ved å melde deg på, og du bestemmer selv om du vil kjøpe når boka kommer.",
  },
  {
    question: "Hva bruker dere e-postadressen min til?",
    answer:
      "Til å si fra når boka kan bestilles, og til å sende deg en smakebit eller annet påfyll om vekst innimellom. Du kan melde deg av når som helst, og adressen din deles aldri med andre.",
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
    "Du står på lista! Du hører fra meg så snart boka kan bestilles."
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
  title: BOOK_FULL_TITLE,
  slug: "verdifull-vekst",
  pageType: "landing",
  meta: {
    title: BOOK_FULL_TITLE,
    description:
      "Endring, KI, salg og markedsføring gjort enkelt. Ny bok av Susanne Todnem, ute i høst. Meld deg på ventelista, så får du beskjed først.",
  },
  layout: [
    {
      blockType: "bookHero",
      // Blokk-navnet blir #anker, så CTA-en nederst kan hoppe hit.
      blockName: "Venteliste",
      badge: "Kommer i høst",
      eyebrow: "Ny bok av Susanne Todnem",
      title: BOOK_FULL_TITLE,
      // Bokas egen undertittel og Susannes egne ord fra manuset – ikke
      // markedsføringsspråk skrevet utenfra.
      subtitle:
        "Endring, KI, salg og markedsføring gjort enkelt. Alt jeg skulle ønske at jeg selv visste da jeg startet bedrift for ti år siden. Meld deg på ventelista, så hører du fra meg når boka kommer.",
      bullets: [
        { text: "Til deg som drømmer stort og driver lite" },
        { text: "Ti år som gründer – oppturer, nedturer og stjernesmeller" },
        { text: "VEKST-modellen: visjon, endring, kunder og KI, salg og tall" },
        { text: "Skrevet for små bedrifter, ikke for Silicon Valley" },
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
      note: "Gratis. Du forplikter deg ikke til å kjøpe noe.",
    },
    // Bevisst tynn side: heroen er handlinga, featureGrid forteller hva boka
    // GIR (kortet i heroen stiller spørsmålene – denne seksjonen svarer på hva
    // du sitter igjen med, så de utfyller hverandre i stedet for å gjenta),
    // FAQ tar innvendingene, og CTA-en nederst er ÉN påminnelse. Nedtelling og
    // tekstbånd ble kuttet — de gjentok heroen. Blokkene finnes fortsatt i
    // blokkvelgeren: nedtellinga er verdt å sette inn tett på lansering.
    // Sida sier bevisst «i høst», ikke en eksakt dato — datoen er ikke
    // kommunisert utad ennå.
    {
      blockType: "featureGrid",
      eyebrow: "Om boka",
      title: "Det er forskjell på vekst og verdifull vekst",
      intro:
        "Verdifull vekst er den du opplever når du selv har bestemt hvor du vil, og du klarer å skape endring som betyr noe for deg eller for andre.",
      columns: "3",
      features: [
        {
          title: "Vekst kan være så mangt",
          text: "Økt omsetning. Personlig utvikling. Et nytt produkt, en ny by – eller flere uker fri i året. Det finnes tusen måter å vokse på.",
        },
        {
          title: "Omsetning er ikke hele bedriften",
          text: "Omsetningen er hovedpulsåren. Men hva med hjertet, hjernen og lungene til bedriften?",
        },
        {
          title: "Små justeringer, stor endring",
          // Bevisst ETT «tenk om» – to retoriske spørsmål på rad lukter
          // generert tekst, og «gjennombrudd»-varianten var ren hype.
          text: "Tenk om det bare er små justeringer som skal til for å skape radikal endring i bedriften din?",
        },
      ],
    },
    {
      // Historien bak boka, med Susannes egne tall fra manuset. `split` er
      // valgt bevisst: da står tallene på sidas vanlige bakgrunn i stedet for
      // enda et farget panel (retningslinja er maks to per side, og CTA-en
      // nederst bruker det ene).
      blockType: "statsBand",
      layout: "split",
      eyebrow: "Historien bak boka",
      title: "Jeg reddet en bedrift jeg ikke ville ha",
      description:
        "Jeg drev markedsføringsbyrået på åttende året. Fire ansatte, og pilene hadde pekt oppover i alle år. Så mistet vi de to største kundene på likt – og kort etter forsvant den tredje. Vi solgte oss ut av krisen på fire måneder. Men da støvet la seg, gikk det opp for meg at bedriften hadde vokst helt uten retning. Det er den erkjennelsen boka er bygget på.",
      stats: [
        {
          value: 75,
          suffix: " %",
          label: "av den faste omsetningen forsvant",
        },
        { value: 3, label: "kunder tapt på to måneder" },
        {
          value: 68,
          suffix: " %",
          label: "omsetningsvekst de neste tre månedene",
        },
      ],
    },
    {
      blockType: "faq",
      // Ingen eyebrow: «Spørsmål» over «Det folk lurer på» sa det samme to
      // ganger. Etiketten skal tilføre kontekst, ellers droppes den.
      title: "Det folk lurer på",
      items: faqItems,
    },
    {
      blockType: "ctaSection",
      variant: "colored",
      title: "Vil du vite når boka kommer?",
      // Kort med vilje: «før alle andre» står i FAQ-en, og gratis/uforpliktende
      // står i hero-noten og FAQ-en – tredje gjentakelse kuttet.
      description: "Sett deg på ventelista, så sier jeg fra i høst.",
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
