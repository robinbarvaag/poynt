/**
 * Seeder forsiden (Forside-globalen) med et fullt utkast: credibility-først,
 * hybrid merkevare og en «to dører»-seksjon. Fletter den nye IA-en med
 * bevist innhold fra dagens poynt.no. Idempotent (overskriver globalen).
 * Norsk plassholder-/utkast-tekst — finpuss i admin.
 *
 *   bun run --cwd apps/web payload run scripts/seed-homepage.ts
 */
import config from "@payload-config";
import { getPayload } from "payload";

const layout = [
  // 1 — Hero: bevist hovedbudskap fra dagens forside
  {
    blockType: "hero",
    title: "Markedsføring og AI gir deg verdifull vekst",
    subtitle:
      "Foredrag, rådgivning og medlemskap som gjør deg mer synlig, tryggere på markedsføring og smartere med AI.",
    tagsLabel: "Jeg hjelper deg med:",
    tags: [
      { label: "Markedsføring" },
      { label: "AI" },
      { label: "Kommunikasjon" },
      { label: "Foredrag" },
    ],
    primaryCta: { text: "Jeg vil ha hjelp", url: "/tjenester" },
    secondaryCta: { text: "Bli medlem i On Poynt", url: "/on-poynt" },
  },

  // 2 — To dører: gründer vs bedrift
  {
    blockType: "pathCards",
    eyebrow: "Hvor vil du begynne?",
    title: "Velg din vei",
    intro:
      "Enten du bygger noe selv eller leter etter kompetanse til bedriften – det er en vei for deg.",
    columns: "2",
    paths: [
      {
        eyebrow: "For deg som",
        title: "Jeg er gründer",
        description:
          "Verktøy, kurs og fellesskap som hjelper deg å bygge og vokse – i ditt eget tempo.",
        href: "/for-grundere",
        ctaLabel: "Se hva som er inkludert",
        surface: "saffron",
        items: [
          { text: "On Poynt-medlemskap med AI-verktøy" },
          { text: "Kurs og digitale produkter" },
          { text: "Et fellesskap av andre gründere" },
        ],
      },
      {
        eyebrow: "For deg som",
        title: "Vi er en bedrift",
        description:
          "Hent inn kompetanse til markedsføring, styret eller en scene.",
        href: "/for-bedrifter",
        ctaLabel: "Ta kontakt",
        surface: "mint",
        items: [
          { text: "Rådgivning innen markedsføring og kommunikasjon" },
          { text: "Styreverv og styrearbeid" },
          { text: "Foredrag og workshops" },
        ],
      },
    ],
  },

  // 3 — Kunde-stripe (tekst, uten logoer ennå)
  {
    blockType: "logoCloud",
    label: "Noen jeg har jobbet med",
    logos: [
      { name: "Bouvet" },
      { name: "Vår Energi" },
      { name: "Janove" },
      { name: "Kitch'n" },
      { name: "NOFO" },
      { name: "Tilbords" },
      { name: "King Oscar" },
      { name: "Norsk Dyremat" },
    ],
  },

  // 4 — Om Susanne (teaser → /om)
  {
    blockType: "ctaSection",
    variant: "simple",
    title: "19 år med markedsføring – og fortsatt like nysgjerrig",
    description:
      "Jeg er Susanne Todnem – markedsfører, journalist og foredragsholder, med bakgrunn fra bank, IT og fintech. Jeg jobber med alt fra børsnoterte selskaper til bedrifter med to ansatte.",
    primaryCta: { text: "Bli kjent med meg", url: "/om" },
  },

  // 5 — Tjenester / slik kan jeg hjelpe
  {
    blockType: "featureGrid",
    eyebrow: "Tjenester",
    title: "Trenger du hjelp med markedsføring eller kommunikasjon?",
    columns: "3",
    features: [
      {
        title: "Rådgivning",
        text: "Markedsføring og kommunikasjon – fra strategi til gjennomføring.",
        linkLabel: "Les mer",
        linkUrl: "/tjenester",
      },
      {
        title: "Kurs og foredrag",
        text: "AI for bedrifter og LinkedIn er de mest etterspurte temaene.",
        linkLabel: "Les mer",
        linkUrl: "/tjenester",
      },
      {
        title: "Medlemskap",
        text: "Bli med i On Poynt og få inspirasjon og kunnskap som letter arbeidshverdagen.",
        linkLabel: "Bli medlem",
        linkUrl: "/on-poynt",
      },
    ],
  },

  // 6 — Tall / troverdighet
  {
    blockType: "statsBand",
    eyebrow: "Om Susanne Todnem",
    title: "Erfaring som teller",
    variant: "primary",
    stats: [
      { value: 19, suffix: "+ år", label: "med markedsføring" },
      { value: 5, label: "egne bedrifter startet" },
      { value: 9, suffix: "+", label: "merkevarer jeg har jobbet med" },
    ],
  },

  // 7 — On Poynt-spotlight
  {
    blockType: "ctaSection",
    variant: "colored",
    title: "Bli medlem i On Poynt",
    description:
      "Det kan være ensomt å sitte alene med markedsføringsansvaret. I On Poynt får du fellesskap, ressurser og oppdatert kunnskap – så du kan jobbe smartere med markedsføring og AI.",
    primaryCta: { text: "Sjekk ut medlemskapet", url: "/on-poynt" },
    secondaryCta: { text: "Se verktøyene", url: "/verktoy" },
  },

  // 8 — Utvalgte produkter
  {
    blockType: "productArchive",
    title: "Medlemskap, digitale produkter og bok",
    selectionMode: "auto",
    filterByType: "all",
    limit: 3,
    layout: "grid",
    showMoreLink: true,
  },

  // 9 — Kundehistorier (ekte sitater fra dagens poynt.no)
  {
    blockType: "testimonials",
    eyebrow: "Kundehistorier",
    title: "Hva kundene sier",
    layout: "cards",
    columns: "3",
    testimonials: [
      {
        quote:
          "Å være kunde hos Poynt er virkelig en glede! Med en stødig og pålitelig rådgiver på laget, føler vi oss trygge og ivaretatt. Poynt har løftet våre sosiale medier til et helt nytt nivå. Kvalitet, fleksibilitet og profesjonalitet!",
        author: "Veronica Halvorsen",
        role: "Rådgiver kommunikasjon",
        company: "NOFO",
      },
      {
        quote:
          "Poynt stilte opp på og tok over ansvaret for våre sosiale medier i rekordfart, og fikk ansvaret for innholdsproduksjon og publisering. Poynt tok eierskap til jobben og ga alt fra dag én!",
        author: "Kenneth Kolnes",
        role: "Forretningsutvikler",
        company: "Tilbords og Kitch'n",
      },
      {
        quote:
          "Vi har brukt Poynt til blant annet innovasjonsprosesser på internasjonalt nivå og LinkedIn-strategi. Susanne er drivende dyktig på området og kommer med helt konkrete råd.",
        author: "Kari-Anne Grude",
        role: "Global markedsdirektør",
        company: "King Oscar",
      },
    ],
  },

  // 10 — Fra podkasten
  {
    blockType: "podcastArchive",
    title: "Fra podkasten",
    description: "Lytt til de siste episodene.",
    limit: 3,
    showMoreLink: true,
  },

  // 11 — Nyhetsbrev
  {
    blockType: "newsletter",
    eyebrow: "Hold deg oppdatert",
    title: "Få inspirasjon rett i innboksen",
    description:
      "Tips om markedsføring, AI og kommunikasjon – med jevne mellomrom.",
    buttonText: "Meld meg på",
    placeholder: "din@epost.no",
    variant: "saffron",
  },
];

const meta = {
  title: "Poynt – Markedsføring og AI gir deg verdifull vekst",
  description:
    "Poynt drives av Susanne Todnem. Foredrag, rådgivning og medlemskap som gjør deg mer synlig, tryggere på markedsføring og smartere med AI.",
};

const payload = await getPayload({ config });

await payload.updateGlobal({
  slug: "homepage",
  // biome-ignore lint/suspicious/noExplicitAny: seed-data matcher blokk-skjemaet
  data: { layout, meta } as any,
});

payload.logger.info("Ferdig med å seede forsiden.");
process.exit(0);
