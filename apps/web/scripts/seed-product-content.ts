/**
 * Fyller produkta med ekte innhald henta frå dagens poynt.no: brødtekst
 * (`description`), forhåndssal-/status-merkelapp, merknad og medlemskaps-
 * søknadslenkje. Tekst på bokmål, slik partnaren skriv. Idempotent: matchar på
 * slug, oppdaterer berre produkt som finst. `skipSync: true` hindrar Stripe-
 * synk. Trygt å køyre fleire gonger.
 *
 *   bun run --cwd apps/web payload run scripts/seed-product-content.ts
 */
import config from "@payload-config";
import { getPayload } from "payload";
import { richText } from "./_lexical";

const content: {
  slug: string;
  statusBadge?: "none" | "new" | "presale" | "soldout" | "custom";
  statusBadgeLabel?: string;
  notice?: string;
  applyUrl?: string;
  shortDescription?: string;
  description: string[];
  highlights?: { icon?: string; text: string }[];
  allowQuantity?: boolean;
  variantLabel?: string;
  variantOptions?: { label: string; priceDelta?: number }[];
}[] = [
  {
    slug: "verdifull-vekst-i-din-bedrift",
    statusBadge: "presale",
    notice:
      "NB! Boka trykkes i høst og kommer til deg i oktober 2026. Dette er forhåndssalg av boka – gratis frakt i hele forhåndsbestillingsperioden!",
    shortDescription:
      "Boka som gir deg konkrete grep for å skape vekst gjennom å forstå KI, salg og markedsføring.",
    description: [
      "Skap verdifull vekst i bedriften din gjennom å forstå KI, salg og markedsføring. Boka er skrevet for små bedrifter, med eksempler fra det norske markedet. Den er til deg som ikke står i fare for å bli kjøpt opp av en amerikansk investor for 400 millioner med det første.",
      "Boka er passelig u-akademisk og lettbeint – alle forstår den!",
      "Du får relaterbare historier fra gründerlivet og forfatterens egen gründerreise, kombinert med oppdatert fagkunnskap og veksttips fra andre gründere i norsk arbeidsliv. I boka blir du presentert for Vekstmodellen, som deler innholdet inn i kapitler navngitt etter akronymet VEKST: V for visjon, E for endring, K for kunder, S for salg og T for tall.",
    ],
    highlights: [
      { icon: "🚚", text: "Gratis frakt i hele forhåndssalget" },
      { icon: "🎤", text: "Foredrag på kjøpet ved 10 bøker eller flere" },
    ],
    allowQuantity: true,
    variantLabel: "Signert?",
    variantOptions: [{ label: "Ja, signert" }, { label: "Nei, takk" }],
  },
  {
    slug: "on-poynt-medlemskap-12-maneder",
    statusBadge: "none",
    applyUrl: "/bli-medlem",
    notice:
      "Medlemskapet kan ikke kjøpes direkte. Send en kort søknad via knappen, så tar vi kontakt.",
    shortDescription:
      "Tilgang til fellesskap, ressurser og KI-verktøy som gjør markedsføringen enklere – i tolv måneder.",
    description: [
      "Vil du skape vekst i bedriften din? Som medlem i On Poynt får du tilgang til verdifulle ressurser som gjør jobben enklere, mer effektiv og mer inspirerende.",
      "✅ Innholdsideer og råd for markedsføring og kommunikasjon",
      "✅ Ferdige maler og sjekklister",
      "✅ Praktiske råd og tips om å skape vekst gjennom bruk av KI",
      "✅ Tilgang til et nettverk av likesinnede – og en gruppe der du kan stille spørsmål",
      "📌 Hold deg oppdatert på trender innen markedsføring og kommunikasjon",
      "📌 Få verktøy som gjør hverdagen din enklere",
      "📌 Få mer struktur og inspirasjon i arbeidshverdagen",
    ],
    highlights: [
      { icon: "💳", text: "Betal med faktura eller del opp i fire deler" },
      { icon: "👥", text: "Tilgang til et nettverk av likesinnede" },
    ],
  },
  {
    slug: "innholdsideer-til-linkedin",
    statusBadge: "none",
    shortDescription:
      "Ferdige innholdsideer som gjør LinkedIn-jobben enklere – og mer effektiv.",
    description: [
      "Vil du lage innhold som engasjerer, men synes det er vanskelig å komme opp med alle ideene selv? Denne PDF-en gir deg konkrete innholdsideer for å øke synligheten din og styrke nettverket ditt på LinkedIn.",
      "📌 Bygg synlighet og troverdighet i bransjen din",
      "📌 Engasjer nettverket ditt med verdifullt innhold som skaper diskusjon",
      "📌 Tiltrekk nye kunder eller arbeidsgivere gjennom relevant og strategisk publisering",
      "📌 Bruk LinkedIn til å drive trafikk til nettsiden eller tjenestene dine",
      "🚀 Last ned filen og få 40 LinkedIn-ideer du kan ta i bruk umiddelbart.",
    ],
    highlights: [
      { icon: "💡", text: "Gratis for medlemmer i On Poynt" },
      { icon: "⚡", text: "40 ferdige ideer – klare til bruk" },
    ],
  },
  {
    slug: "75-innholdsideer-til-instagram",
    statusBadge: "none",
    shortDescription:
      "75 klare ideer til Instagram-innhold du kan ta i bruk med en gang.",
    description: [
      "Sliter du med å finne nye ideer til Instagram-innhold? Denne PDF-en gir deg 75 konkrete og enkle innholdsideer du kan bruke for å engasjere følgerne dine, øke synligheten og styrke merkevaren din.",
      "📌 Slutt på idé-tørke!",
      "📌 Bygg en sterkere merkevare med strategisk og engasjerende innhold",
      "📌 Få flere følgere og kunder med innhold som skaper verdi",
      "📌 Tilpasset for både små bedrifter, influensere og kreative skapere",
      "🚀 Last ned guiden nå og få 75 effektive Instagram-ideer du kan begynne å bruke umiddelbart!",
    ],
    highlights: [
      { icon: "⚡", text: "75 ferdige ideer – klare til bruk" },
      { icon: "📲", text: "For bedrifter, influensere og skapere" },
    ],
  },
  {
    slug: "tips-for-a-lykkes-med-pinterest",
    statusBadge: "new",
    shortDescription:
      "Praktiske tips for å få mer ut av Pinterest som markedskanal.",
    description: [
      "Vil du bruke Pinterest som markedsføringskanal for å drive mer trafikk til nettstedet ditt, men er usikker på hvordan du kommer i gang? Denne guiden gir deg praktiske tips for å lykkes med Pinterest – enten du er bedriftseier, blogger eller innholdsprodusent.",
      "Hvorfor bør du bruke Pinterest til markedsføring?",
      "📌 Lavere konkurranse enn på andre plattformer – lettere å skape synlighet",
      "📌 Langvarig trafikk – innholdet ditt blir søkbart og relevant over tid",
      "📌 Perfekt for organisk vekst – nå målgruppen din uten å betale for annonser",
      "📌 Direkte lenker til nettsiden din – kortere vei til konvertering og salg",
      "🚀 Last ned guiden nå og ta de første stegene mot en vellykket Pinterest-strategi!",
    ],
    highlights: [
      { icon: "🌱", text: "Organisk vekst uten annonsekroner" },
      { icon: "⏳", text: "Langvarig, søkbar trafikk over tid" },
    ],
  },
];

const payload = await getPayload({ config });

for (const item of content) {
  const { slug, description, ...fields } = item;
  const existing = await payload.find({
    collection: "products",
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  });

  if (existing.docs.length === 0) {
    payload.logger.warn(`Hoppar over – fann ikkje produkt med slug: ${slug}`);
    continue;
  }

  await payload.update({
    collection: "products",
    id: existing.docs[0].id,
    data: {
      ...fields,
      description: richText(description),
      skipSync: true,
      // biome-ignore lint/suspicious/noExplicitAny: seed-data matcher produkt-skjemaet
    } as any,
  });
  payload.logger.info(`Oppdaterte innhald på produkt: ${slug}`);
}

payload.logger.info("Ferdig med å seede produkt-innhald.");
process.exit(0);
