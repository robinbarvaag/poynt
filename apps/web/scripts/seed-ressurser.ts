/**
 * Seeder en SKJULT ressursside («QR-kode-sida»): oversiktsside med sidemeny,
 * objekt-hero som innholdsfortegnelse, KI-tips, prompter, arbeidsflyter,
 * bøker/podkast/musikk og filer. Idempotent på tittel: oppdaterer om den
 * finnes, ellers opprettes den som UTKAST med en adresse som ikke kan gjettes
 * (slug settes av beforeValidate-hooken når `unlisted` er på og slug er tom).
 *
 * Innholdet er EKSEMPLER som viser hva hver blokk kan – Susanne bytter ut
 * tekst, lenker og filer i admin. Ingen ekte anbefalinger eller filer er
 * funnet på her; det som ligger inne er plassholdere merket «Eksempel».
 *
 *   bun run --cwd apps/web payload run scripts/seed-ressurser.ts
 */
import config from "@payload-config";
import { getPayload } from "payload";

const PAGE_TITLE = "Verktøykassa – ressurser fra Susanne";

const payload = await getPayload({ config });

const layout = [
  {
    blockType: "bookHero",
    blockName: "Intro",
    badge: "Oppdatert september 2026",
    eyebrow: "Fra Susanne",
    title: "Verktøykassa mi",
    subtitle:
      "Prompter, arbeidsflyter, bøker og filer jeg bruker selv. Alt på ett sted – kom tilbake når du trenger det.",
    // Kortet er innholdsfortegnelsen: hvert «kapittel» lenker til seksjonen
    // under (blokk-navnet blir ankeret).
    chapters: [
      {
        title: "KI-tips",
        text: "Små grep som gjør at KI-verktøyene faktisk hjelper deg.",
        href: "#ki-tips",
        linkLabel: "Se tipsene",
      },
      {
        title: "Prompter",
        text: "Ferdige prompter du kopierer med ett trykk.",
        href: "#prompter",
        linkLabel: "Hent prompter",
      },
      {
        title: "Arbeidsflyter",
        text: "Slik setter du opp en uke som gir plass til det viktige.",
        href: "#arbeidsflyter",
      },
      {
        title: "Anbefalinger",
        text: "Bøker, podkaster og musikk å jobbe til.",
        href: "#anbefalinger",
      },
      {
        title: "Filer",
        text: "Maler og sjekklister til nedlasting.",
        href: "#filer",
      },
    ],
    primaryCta: { text: "Hopp til prompter", url: "#prompter" },
    secondaryCta: { text: "Se filene", url: "#filer" },
    note: "Siden ligger ikke i menyen – lagre adressen eller skann QR-koden igjen.",
    figureSide: "right",
    figureAspect: "card",
    palette: "poynt",
    rotatorEyebrow: "På denne siden",
    rotatorMarkers: "numbers",
    rotatorInterval: 5,
    shapes: "subtle",
  },
  {
    blockType: "featureGrid",
    blockName: "KI-tips",
    eyebrow: "KI-tips",
    title: "Små grep som gjør KI nyttig",
    intro:
      "Du trenger ikke lære deg alt. Disse fire vanene gir mest igjen for minst innsats.",
    columns: "2",
    features: [
      {
        title: "Gi den en rolle*",
        text: "«Du er regnskapsføreren min» gir bedre svar enn «hjelp meg med regnskap».",
      },
      {
        title: "Lim inn eksempler",
        text: "Vis hvordan du skriver, så treffer den tonen din i stedet for sin egen.",
      },
      {
        title: "Be om tre varianter",
        text: "Første svar er sjelden best. Tre forslag gir deg noe å velge mellom.",
      },
      {
        title: "Spør hva den trenger",
        text: "«Hvilke spørsmål må du ha svar på for å gjøre dette bra?» sparer en runde.",
      },
    ],
  },
  {
    blockType: "promptLibrary",
    blockName: "Prompter",
    eyebrow: "Prompter",
    title: "Kopier, lim inn, bytt ut det i [klammer]",
    intro:
      "Skriv gjerne på norsk – verktøyene forstår det fint. Eksemplene under er utgangspunkt; juster dem til din bedrift.",
    columns: "2",
    prompts: [
      {
        title: "Ukas innhold på 10 minutter",
        tool: "ChatGPT",
        tags: "innhold, sosiale medier",
        description:
          "Når du vet hva du vil si, men ikke orker å skrive fem varianter.",
        prompt:
          "Du er innholdsrådgiver for [bedriftsnavn], som selger [hva] til [hvem].\n\nJeg vil dele dette poenget denne uka: [poenget].\n\nLag tre korte innlegg til LinkedIn/Instagram med ulik vinkel: ett personlig, ett praktisk (3 tips) og ett som stiller et spørsmål. Norsk, nøkternt, ingen emojier, maks 80 ord hver.",
      },
      {
        title: "Svar på en vanskelig e-post",
        tool: "Claude",
        tags: "e-post",
        description: "Når du må si nei, men vil beholde relasjonen.",
        prompt:
          "Her er en e-post jeg har fått: [lim inn].\n\nSkriv et svar der jeg takker nei til [hva], men holder døra åpen. Vennlig, kort, uten unnskyldninger. Foreslå ett alternativ.",
      },
      {
        title: "Kundeintervju-guide",
        tool: "Alle KI-verktøy",
        tags: "kunder",
        description: "Før du ringer en kunde for å forstå hvorfor de kjøpte.",
        prompt:
          "Jeg driver [bedrift] og skal intervjue en kunde som kjøpte [produkt/tjeneste] for [tid] siden.\n\nLag en intervjuguide med 8 åpne spørsmål: situasjonen før de fant oss, hva som fikk dem til å lete, alternativene de vurderte, hva som avgjorde valget, hva som overrasket dem etterpå, og hva de ville sagt til en venn.\n\nUnngå ja/nei-spørsmål. Legg til et oppfølgingsspørsmål per hovedspørsmål. Avslutt med hva jeg bør lytte etter i svarene.",
      },
      {
        title: "Oppsummer et møte",
        tool: "Copilot",
        description: "Lim inn notatene dine, få en ryddig oppsummering.",
        prompt:
          "Oppsummer disse møtenotatene i tre deler: beslutninger, oppgaver (med ansvarlig og frist) og åpne spørsmål. Norsk, punktlister.\n\n[notater]",
      },
    ],
  },
  {
    blockType: "steps",
    blockName: "Arbeidsflyter",
    eyebrow: "Arbeidsflyter",
    title: "Søndagsplanen",
    intro: "Tjue minutter søndag kveld som gjør mandag lettere.",
    steps: [
      {
        title: "Tøm hodet",
        text: "Alt som ligger og surrer, ned på papir. Ti minutter, ingen sortering.",
      },
      {
        title: "Velg tre",
        text: "Tre ting som faktisk flytter bedriften denne uka. Resten kan vente.",
      },
      {
        title: "Blokker tid",
        text: "Legg de tre i kalenderen før møtene tar plassen.",
      },
    ],
  },
  {
    blockType: "resourceList",
    blockName: "Anbefalinger",
    eyebrow: "Anbefalinger",
    title: "Bøker, podkaster og musikk å jobbe til",
    intro:
      "Ting jeg bruker selv. Filtrer på kategori. (Eksempler – bytt ut med dine egne.)",
    layout: "grid",
    columns: "3",
    showFilter: "auto",
    items: [
      {
        title: "Eksempel: en bok om fokus",
        kind: "book",
        description:
          "Legg inn boka du anbefaler oftest, og én setning om hvorfor.",
        url: "https://example.com",
        category: "Bøker",
        note: "Forfatter",
      },
      {
        title: "Eksempel: en podkast",
        kind: "podcast",
        description: "Episoden eller serien du sender til folk.",
        url: "https://example.com",
        category: "Podkast",
      },
      {
        title: "Eksempel: spilleliste for fokus",
        kind: "music",
        description: "Musikken som går når du skriver.",
        url: "https://open.spotify.com",
        category: "Musikk",
      },
      {
        title: "Eksempel: et verktøy",
        kind: "tool",
        description: "Appen eller tjenesten du ikke klarer deg uten.",
        url: "https://example.com",
        category: "Verktøy",
      },
    ],
  },
  {
    blockType: "resourceList",
    blockName: "Filer",
    eyebrow: "Filer",
    title: "Maler og sjekklister",
    intro:
      "Last opp filene i admin (Media) og velg dem på hver rad – da får leseren en last-ned-knapp.",
    layout: "list",
    showFilter: "never",
    items: [
      {
        title: "Eksempel: ukesplan-mal",
        kind: "file",
        description: "Én side. Fylles ut søndag kveld.",
        note: "PDF",
      },
      {
        title: "Eksempel: sjekkliste før lansering",
        kind: "file",
        description: "Alt som må være på plass før du trykker publiser.",
        note: "PDF",
      },
    ],
  },
  {
    blockType: "ctaSection",
    blockName: "Savner du noe",
    title: "Savner du noe?",
    description: "Send meg en melding, så legger jeg det til.",
    primaryCta: { text: "Ta kontakt", url: "/kontakt" },
  },
];

const existing = await payload.find({
  collection: "pages",
  where: { title: { equals: PAGE_TITLE } },
  limit: 1,
  depth: 0,
});

const data = {
  title: PAGE_TITLE,
  pageType: "hub",
  unlisted: true,
  layout,
  meta: {
    title: "Verktøykassa",
    description:
      "Ressurser fra Susanne – prompter, arbeidsflyter, bøker og filer.",
    noIndex: true,
  },
};

if (existing.docs.length > 0) {
  const doc = existing.docs[0];
  await payload.update({
    collection: "pages",
    id: doc.id,
    // biome-ignore lint/suspicious/noExplicitAny: seed-data matcher blokk-skjemaene
    data: data as any,
    draft: true,
  });
  payload.logger.info(`Oppdaterte utkast: ${PAGE_TITLE} (/${doc.slug})`);
} else {
  const created = await payload.create({
    collection: "pages",
    // biome-ignore lint/suspicious/noExplicitAny: seed-data matcher blokk-skjemaene
    data: { ...data, _status: "draft" } as any,
    draft: true,
  });
  payload.logger.info(
    `Opprettet utkast: ${PAGE_TITLE} → /${created.slug} (publiser i admin når innholdet er klart)`
  );
}

process.exit(0);
