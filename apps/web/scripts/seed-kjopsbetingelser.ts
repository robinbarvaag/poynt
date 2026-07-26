/**
 * Seeder /kjopsbetingelser — Kjøpsbetingelser (overført fra poynt.no).
 * Idempotent: oppdaterer hvis siden finnes, ellers opprettes den.
 *
 *   bun run --cwd apps/web payload run scripts/seed-kjopsbetingelser.ts
 */
import config from "@payload-config";
import { getPayload } from "payload";
import { type DocBlock, richDoc } from "./_lexical";

const body: DocBlock[] = [
  "Selger er Poynt AS (Org. nr: 930 714 151) og betegnes i det følgende som selger/selgeren. Kjøper er den forbrukeren/bedriften som foretar bestillingen, og betegnes i det følgende som kjøper/kjøperen.",
  "Denne avtalen har som mål å etablere tydelige og sikre rammer for din bestilling og bruk av både gratis og betalte tjenester. Målet er å minimere muligheten for misforståelser og legge til rette for et godt og ryddig samarbeid mellom partene.",
  "Hvis du har spørsmål om innholdet i denne avtalen, er du velkommen til å kontakte oss på e-postadressen hei@poynt.no.",
  "Når du fullfører et kjøp, bekrefter du at du har lest, forstått og akseptert vilkårene som er fastsatt i denne avtalen.",
  "Eksempler på gratisressurser er nedlastbare filer tilgjengelig på www.poynt.no. Betalte ressurser er både medlemskapet i On Poynt og betalte nedlastbare filer.",

  { heading: "Pris og betaling" },
  "Din medlemsavgift forblir uendret gjennom hele perioden du er medlem. Dersom du velger å avslutte medlemskapet og deretter ønsker å melde deg inn igjen på et senere tidspunkt, vil medlemsprisen som gjelder på det tidspunktet for nyinnmeldinger bli gjeldende.",
  "Betaling for medlemskapet skjer ved bruk av vår betalingssløsning med Stripe eller ved å be om faktura. Dersom faktura benyttes er medlemskapet gjeldende fra den dagen vi har mottatt betalingen. Faktura gis ved henvendelse med 14 dagers betalingsfrist.",
  "Priser for andre produkter enn medlemskapet vil bli oppgitt individuelt på våre salgssider, sånn at du alltid har oversikt over kostnadene før du fullfører kjøpet.",

  { heading: "Levering" },
  "Alle produkter er digitale og leveres ved kjøpsøyeblikket. Velger du faktura, kan det ta opp til 1 virkedag før du får tilgang.",

  { heading: "Medlemskap og produkter" },
  "For medlemskapet forbeholder Poynt AS seg retten til å tilpasse innhold, plattform, metoder og struktur over tid. Som medlem får du løpende tilgang til portalen og fellesskapet, og denne tilgangen opprettholdes så lenge medlemskapet ditt er aktivt.",
  "Ved å tegne medlemskap i On Poynt, forplikter du deg til å følge retningslinjene som gjelder for vårt fellesskap. All bruk av innhold fra On Poynt, enten det er gratis eller kjøpt, er betinget av at du etterlever de vilkårene som er beskrevet her.",
  "Produkter og innhold som lastes ned eller kjøpes fra oss, er kun ment til personlig bruk og skal ikke benyttes til andre formål.",
  "Alle filer og produkter fra Poynt AS er beskyttet av opphavsrett. Uautorisert bruk, kopiering eller deling er forbudt uten skriftlig samtykke fra Poynt AS.",
  "Oppsummert:",
  {
    list: [
      "Våre produkter og innhold må ikke kopieres, videresendes, selges, leies ut, deles videre eller distribueres på noen måte, uavhengig av om de er betalt eller gratis.",
      "Ved brudd på disse betingelsene, aksepterer du å dekke eventuelle kostnader, krav, skader eller tap som oppstår som følge av handlingene dine.",
    ],
  },
  "Du forplikter deg også til å unngå enhver bruk av vårt innhold som kan skade vår virksomhet eller vårt omdømme. All opphavsrett og immaterielle rettigheter til produktene, enten de er redigert eller uendret, tilhører fullt ut On Poynt og vil fortsette å være vår eiendom.",
  "Du erkjenner at du ikke har rett til å kreve eierskap til noe av materialet eller produktene vi har utviklet, og at du heller ikke kan kreve opphavsrett til noe av vårt innhold.",
  "Videre er du inneforstått med at On Poynt, eller våre samarbeidspartnere, ikke kan garantere resultater for din virksomhet ved bruk av våre produkter eller tjenester. Vi kan ikke holdes ansvarlige for hvordan våre metoder påvirker din omsetning, inntekter eller kostnader, og vi gir ingen løfter om vekst eller suksess. Det er ditt ansvar å vurdere hvordan du bruker de ressursene vi tilbyr.",

  { heading: "Oppsigelse av medlemskap" },
  "Medlemskapet blir automatisk sagt opp når din medlemstid går ut, enten du har kjøpt seks måneder eller et år. Du vil få en e-post litt før medlemskapet utløper, der du selv kan velge om du ønsker å kjøpe ny tilgang og fortsette medlemsskapet.",

  { heading: "Konfidensialitet" },
  "Ved å delta i programmet aksepterer du at du kan få tilgang til informasjon som omhandler Poynt AS og andre deltakeres virksomheter, eller deres personlige forhold. Denne informasjonen er å anse som konfidensiell, og du påtar deg et ansvar for å behandle den med diskresjon og respekt.",
  "Det er strengt forbudt å dele eller videreformidle slik informasjon til utenforstående, uavhengig av form eller medium. Taushetsplikten gjelder for å sikre et trygt og tillitsfullt miljø for alle deltakere.",
  "Denne taushetsplikten gjelder ikke for dine egne erfaringer eller resultater knyttet til deltakelsen i programmet. Du står fritt til å dele dine personlige opplevelser og suksesshistorier, så lenge det ikke innebærer å røpe konfidensiell informasjon om andre deltakere, deres bedrifter eller Poynt AS.",
  "Vi ønsker å skape en trygg arena der alle deltakere kan føle seg komfortable med å dele og diskutere uten frykt for at informasjonen deres skal bli misbrukt eller spredt uten deres samtykke. Brudd på denne konfidensialiteten vil bli tatt på alvor og kan føre til konsekvenser, inkludert umiddelbar utestengelse fra programmet.",

  { heading: "Renter ved forsinket betaling/inkassogebyr" },
  "Dersom kjøperen ikke betaler kjøpesummen i henhold til avtalen, kan selger kreve renter av kjøpesummen etter forsinkelsesrenteloven. Ved manglende betaling kan kravet, etter forutgående varsel, bli sendt til inkasso. Kjøper kan da bli holdt ansvarlig for gebyr etter inkassoloven.",

  { heading: "Angrerett og garanti" },
  "Som privat forbruker har du rett til å benytte deg av den lovbestemte angreretten, som gir deg 14 dagers angrefrist fra datoen for kjøpet. Dette betyr at du innen denne tidsrammen kan kansellere kjøpet ditt uten å oppgi noen grunn, så lenge angreretten er i henhold til gjeldende regler. Du kan også reklamere på produktet innen 14 dager.",
  "Vær oppmerksom på at angreretten ikke gjelder for bedriftskunder og bedrifter. Kjøp gjort på vegne av en virksomhet eller organisasjon omfattes derfor ikke av denne rettigheten.",
  "Alle produkter og tjenester leveres slik de er, og det er ditt ansvar å vurdere om de passer for dine formål før kjøpet gjennomføres.",

  { heading: "Personopplysninger" },
  "Behandlingsansvarlig for innsamlede personopplysninger er selger. Med mindre kjøperen samtykker til noe annet, kan selgeren, i tråd med personopplysningsloven, kun innhente og lagre de personopplysninger som er nødvendig for at selgeren skal kunne gjennomføre forpliktelsene etter avtalen. Kjøperens personopplysninger vil kun bli utlevert til andre hvis det er nødvendig for at selger skal få gjennomført avtalen med kjøperen, eller i lovbestemte tilfelle.",

  { heading: "Konfliktløsning" },
  "Klager rettes til selger innen rimelig tid, jf. punkt 9 og 10. Partene skal forsøke å løse eventuelle tvister i minnelighet. Dersom dette ikke lykkes, kan kjøperen ta kontakt med Forbrukertilsynet for mekling. Forbrukertilsynet er tilgjengelig på telefon 23 400 600 eller www.forbrukertilsynet.no.",
  "Europa-Kommisjonens klageportal kan også brukes hvis du ønsker å inngi en klage. Det er særlig relevant, hvis du er forbruker bosatt i et annet EU-land. Klagen inngis her: http://ec.europa.eu/odr.",

  { heading: "Kontakt" },
  "Bedriftens navn: Poynt AS\nE-post: hei@poynt.no\nOrg. nr: 930 714 151\nPostadresse: Ramsvigstien 5a, 4015 Stavanger\nTelefon: 97609053",
];

const page = {
  title: "Kjøpsbetingelser",
  slug: "kjopsbetingelser",
  meta: {
    description:
      "Vilkår for bestilling og bruk av Poynt AS sine gratis og betalte tjenester – pris, levering, angrerett og mer.",
  },
  layout: [
    {
      blockType: "hero",
      title: "Kjøpsbetingelser",
      subtitle:
        "Vilkårene som gjelder når du bestiller og bruker Poynt AS sine produkter og tjenester.",
    },
    {
      blockType: "content",
      richText: richDoc(body),
    },
  ],
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

payload.logger.info("Ferdig med å seede /kjopsbetingelser.");
process.exit(0);
