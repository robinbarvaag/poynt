/**
 * Seeder /personvern — Personvernerklæring (overført fra poynt.no).
 * Idempotent: oppdaterer hvis siden finnes, ellers opprettes den.
 *
 *   bun run --cwd apps/web payload run scripts/seed-personvern.ts
 */
import config from "@payload-config";
import { getPayload } from "payload";
import { type DocBlock, richDoc } from "./_lexical";

const body: DocBlock[] = [
  { heading: "1. Sentrale begreper" },
  "Personopplysninger er informasjon som alene eller sammen med andre opplysninger kan brukes til å identifisere, lokalisere eller kontakte en person. Eksempler på personopplysninger er navn, telefonnummer og IP-adresse.",
  "Behandling av personopplysninger innebærer alle former for håndtering av personopplysninger som: innsamling, analyse, registrering og lagring.",
  "Behandlingsansvarlig er den som bestemmer formålet med behandlingen av personopplysninger og hvilke opplysninger som anmodes. Det er behandlingsansvarlig som er ansvarlig for at håndteringen av dine personopplysninger skjer ut fra den gjeldende personopplysningsloven.",

  { heading: "2. Kontaktinformasjon" },
  "Poynt AS er behandlingsansvarlig for håndtering av dine personopplysninger. Har du spørsmål om behandlingen eller ønsker å komme i kontakt med oss for å utøve dine rettigheter, finner du kontaktinformasjonen vår nedenfor:",
  "Poynt AS\nOrganisasjonsnummer: 930 714 151 MVA\nRamsvigstien 5A, 4015 Stavanger\nE-post: hei@poynt.no\nTlf: 97609053",

  { heading: "3. Behandlingsansvarlig" },
  "Poynt AS er behandlingsansvarlig for håndteringen av dine personopplysninger.",

  { heading: "4. Hva slags informasjon er det vi samler inn?" },
  "Når du registrerer deg via et skjema, bestiller en tjeneste eller produkt, benytter deg av vår chat-funksjon eller besøker vår hjemmeside, kan du bli bedt om å gi fra deg informasjon. Avhengig av situasjonen kan vi muligens be om følgende personopplysninger:",
  {
    list: [
      "Navn",
      "E-postadresse",
      "Telefonnummer",
      "Hvilken virksomhet du jobber for",
      "Stilling eller ansvarsområde",
      "Hjemmesideadresse til virksomheten din",
      "Opplysninger om hvilke type datahjelp ditt firma ønsker og hvilke produkter og pakker de har",
      "Andre opplysninger som utdypende spørsmål eller svar på skjemaer",
      "Tekniske opplysninger: hvilken nettadresse du benytter for å få tilgang til våre nettsider, din IP-adresse og brukeradferd, type nettleser, språk og informasjon om identifisering og operativsystem.",
    ],
  },

  { heading: "5. Paragraf 6 f som alternativ til valgt samtykke via nettside" },
  "Samtykke ditt kan trekkes. Vi tar utgangspunkt i legitimt samtykke utifra Paragraf 6f i personvernloven. Hvis du har inngått et kundeforhold med oss tidligere, eller du er en ny kunde vil dette være en legitim grunn til å sende deg informasjon. Dette sidestilles med et samtykke i henhold til markedsføringsloven slik loven har vært i Norge i mange år.",
  "Du kan når som helst trekke dette samtykket om at vi skal behandle dine personopplysninger.",
  "Trekker du tilbake samtykket, vil vi slette de opplysningene vi har om deg.",
  "Merk at sletting av informasjonen hos oss kan påvirke leveransen av informasjon innenfor rammen for kunderelasjonen, samt påvirke pågående dialoger.",

  { heading: "6. Informasjon fra andre kilder" },
  "Når du samtykker til at vi behandler dine personopplysninger, godkjenner du også at vi kan registrere andre opplysninger om deg som du har gitt oss ved en tidligere anledning. Basert på offentlig tilgjengelig informasjon, kan vi også supplere dine registrerte opplysninger med bransje og ytterligere kontaktinformasjon.",
  "Hvis du er kunde hos oss, kan vi tilføye ytterligere kontaktinformasjon til dine opplysninger, som du har registrert hos oss via f.eks. telefon. Opplysninger som er nødvendige for de tjenester du skal bruke vil også bli lagret.",

  { heading: "7. Formålet med behandlingen av personopplysningene" },
  "Informasjonen du gir fra deg brukes til følgende formål:",
  {
    list: [
      "Salg- og markedsføringsaktiviteter i form av direkte e-post eller telefonkontakt",
      "Kundebehandling og informasjon om våre produkter",
      "For å få statistikk og opplysninger om brukeratferd for å forbedre både hjemmesiden og selve brukeropplevelsen",
      "Å gi deg en mer personlig opplevelse og levere innhold som interesserer deg",
    ],
  },
  "Vi ber om dine personopplysninger for å:",
  {
    list: [
      "Svare på forespørsler",
      "Sende ønsket materiale, eller på andre måter kunne oppfylle våre forpliktelser mot at du sender inn dine opplysninger",
      "Opprette og opprettholde en salgsdialog",
      "Sende informasjon som kan være av interesse for deg",
      "Legge deg til i e-post-liste for nyheter og annet innhold som du selv har valgt å motta",
    ],
  },

  {
    heading:
      "8. Samtykke til e-postkorrespondanse, direkte markedsføring og videre kontakt",
  },
  "Når du samtykker til at vi behandler dine personopplysninger i overensstemmelse med de overnevnte formål, samtykker du til følgende:",
  {
    list: [
      "Vi behandler dine personopplysninger i henhold til denne personvernerklæringen",
      "Vi kan sende deg direkte markedsføring via e-post om våre produkter",
      "Vi kan kontakte deg via e-post eller telefon",
      "Abonnering på nyhetsbrev via e-post du selv har valgt å motta.",
    ],
  },
  "Du kan takke nei til ytterligere e-poster ved å følge linken som befinner seg nederst i våre e-poster, eller ved å kontakte oss direkte.",

  { heading: "9. Hvor lenge lagres opplysningene?" },
  "Vi behandler personopplysningene bare så lenge det tar å oppfylle hensikten med deres innsamling, deretter sletter vi informasjonen.",
  "Har du en aktiv dialog med oss, tar vi vare på opplysningene dine i to år fra den siste kontakten. Deretter fjerner vi opplysningene vi har om deg.",
  "En aktiv dialog defineres som at du har hatt interaksjon med Poynt AS eller representanter for oss de siste to årene via telefon, ved å besvare e-post, lastet ned materiale på nettsiden eller registrert deg via et skjema.",
  "Har du samtykket til behandling av dine personopplysninger i forbindelse med at du takket ja til regelmessig e-poster, fortsetter vi å behandle dine personopplysninger til du avslutter ditt abonnement. Deretter lagrer vi dine personopplysninger i to år før vi sletter informasjonen.",
  "Hvis du er ansatt i en virksomhet som er kunde hos oss, behandler vi dine opplysninger innenfor rammen for kundebehandling. For aktive kunderelasjoner behandler vi dine opplysninger inntil (1) du avslutter din stilling i virksomheten, eller at (2) virksomheten ikke lenger har en aktiv kunderelasjon med oss.",
  "Når en kunderelasjon avsluttes, går vilkårene for lagring og behandling av opplysninger over til de samme vilkårene som er beskrevet i de foregående avsnittene. Avslutter du din ansettelse i virksomheten, er du selv ansvarlig for å gi oss beskjed slik at vi kan slette dine opplysninger.",

  { heading: "10. Hvem kan informasjonen deles med?" },
  "Oppgitte opplysninger vil være tilgjengelige for et begrenset antall personer i virksomheten som enten jobber i markedsavdelingen, kundesupport eller salg.",

  { heading: "11. Informasjonsdeling med tredjepart" },
  "Vi selger ikke dine personopplysninger til tredjepart. Hvis det er en pågående salg- eller kundedialog mellom deg, oss og noen av våre samarbeidspartnere, deler vi informasjon som:",
  {
    list: [
      "Navn",
      "E-postadresse",
      "Telefonnummer",
      "Hvilken virksomhet du jobber for",
    ],
  },
  "Hvis vi har registrert dine opplysninger i forbindelse med en begivenhet som utføres sammen med en ekstern part, kan vi overføre samme kategorier av personopplysninger som angitt ovenfor, samt eventuelle svar på ytterligere skjema- eller utdypende spørsmål.",

  { heading: "12. Hvor oppbevares opplysningene?" },
  "Opplysningene oppbevares av Poynt AS sine kundesystememer.",
  "Vi har også avtaler med tredjeparter som kan oppbevare deler av personopplysningene dine for oss.",

  {
    heading:
      "13. Dine rettigheter i forhold til innsyn, sletting og eventuelt flytting",
  },
  "Du har rett til å få informasjon om hvilke opplysninger vi har om deg. Du kan også kreve at vi retter opp i feilaktige opplysninger eller sletter informasjonen din.",
  "Ønsker du å trekke tilbake ditt samtykke eller kreve å få oversikt over opplysninger, rettelse eller sletting, kontakter du oss på e-postadressen vi har angitt under avsnittet for kontaktinformasjon. For å motta slik info må du sende en elektronisk kopi av forespørselen på et signert dokument. Ønsker du å flytte informasjon, kan vi også hjelpe deg med det.",

  { heading: "14. Andre formål" },
  "Dersom vi skal bruke personopplysningene til et annet formål enn det de ble samlet inn for inntrer informasjonsplikten på nytt og vi må da opplyse hva det nye formålet er og gi deler av informasjonen ovenfor på nytt.",

  { heading: "15. Informasjonskapsler" },
  "Informasjonskapsler (cookies) er små tekstfiler som plasseres på din datamaskin når du laster ned en nettside.",
  "Lagring av opplysninger og behandling av disse opplysningene er ikke tillatt med mindre bruker både har blitt informert om og har gitt sitt samtykke til behandlingen. Brukeren skal få vite om og godkjenne hvilke opplysninger som behandles, hva formålet med behandlingen er og hvem som behandler opplysningene.",
  "Vi bruker kun informasjonskapsler for å gi deg en bedre brukeropplevelse på våre sider slik at du slipper å fylle inn felt på nytt hver gang du er på våre sider.",

  { heading: "16. E-post og telefon" },
  "Vi benytter e-post og telefon som en del av det daglige arbeidet. Relevante opplysninger som kommer frem av telefonsamtaler og e-postutveksling som skjer som en del av kundebehandlingen registreres i kundesystemet.",
  "Våre medarbeidere benytter i tillegg e-post i alminnelig dialog med interne og eksterne kontakter. Den enkelte er ansvarlig for å slette meldinger som ikke lenger er aktuelle, og minst hvert år gjennomgå og slette unødvendig innhold i e-postkassen. Ved fratreden slettes e-postkontoene, men enkelte relevante e-poster vil normalt bli overført til kollegaer.",
  "Sensitive personopplysninger skal ikke sendes med e-post.",
  "Vi gjør deg oppmerksom på at vanlig e-post er ukryptert. Vi oppfordrer deg derfor ikke til å sende taushetsbelagte, sensitive eller andre fortrolige opplysninger via e-post.",
];

const page = {
  title: "Personvernerklæring",
  slug: "personvern",
  meta: {
    description:
      "Slik behandler Poynt AS dine personopplysninger – innsamling, formål, lagring og dine rettigheter.",
  },
  layout: [
    {
      blockType: "hero",
      title: "Personvernerklæring",
      subtitle:
        "Her finner du informasjon om hvordan Poynt AS samler inn, bruker og oppbevarer personopplysninger – og hvilke rettigheter du har.",
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

payload.logger.info("Ferdig med å seede /personvern.");
process.exit(0);
