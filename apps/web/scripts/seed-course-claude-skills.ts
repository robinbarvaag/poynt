/**
 * Seeder eksempelkurset «Kom i gang med skills i Claude» (Claude Desktop /
 * claude.ai) i Kurs-collectionen (On Poynt). Idempotent: upsert på slug,
 * trygt å kjøre om igjen. Kurset er også et referanseeksempel på mønsteret vi
 * vil ha i kurs: korte leksjoner, gjør-selv-steg der medlemmet skal gjøre noe
 * selv, og tydelig utbytte per modul.
 *
 *   bun run --cwd apps/web payload run scripts/seed-course-claude-skills.ts
 */
import config from "@payload-config";
import { type RequiredDataFromCollectionSlug, getPayload } from "payload";
import { type DocBlock, richDoc } from "./_lexical";

type CourseData = RequiredDataFromCollectionSlug<"courses">;

const payload = await getPayload({ config });

const SLUG = "kom-i-gang-med-skills-i-claude";

interface StepSeed {
  title: string;
  body: DocBlock[];
  substeps?: string[];
}

interface LessonSeed {
  title: string;
  content: DocBlock[];
  steps?: StepSeed[];
}

interface ModuleSeed {
  title: string;
  lessons: LessonSeed[];
}

const MODULES: ModuleSeed[] = [
  {
    title: "Hva er en skill – og hvorfor bry seg?",
    lessons: [
      {
        title: "Hva er en skill i Claude?",
        content: [
          "Du har sikkert opplevd å forklare Claude det samme om og om igjen: hvordan dere skriver tilbud, hvilken tone nyhetsbrevet skal ha, eller hvordan månedsrapporten skal se ut. En skill løser akkurat det.",
          "En skill er en liten oppskrift du lagrer én gang, som Claude selv finner fram når oppgaven passer. Du skriver «lag et tilbud til Kari», og Claude husker hele malen din – uten at du limer den inn i hver eneste samtale.",
          { heading: "Tre ting som gjør skills verdt bryet" },
          {
            list: [
              "Du slipper å gjenta deg selv – oppskriften ligger lagret og hentes fram automatisk.",
              "Resultatet blir likt hver gang, uansett hvem i bedriften som spør.",
              "Du kan dele skillen med kollegene, så hele teamet jobber på samme måte.",
            ],
          },
          "Skills finnes i Claude-appen på PC/Mac og på claude.ai, og krever et betalt abonnement. I neste leksjon ser vi på når en skill er riktig verktøy – og når en vanlig melding holder.",
        ],
      },
      {
        title: "Når trenger du en skill – og når ikke?",
        content: [
          "Ikke alt fortjener en skill. Tommelfingerregelen min: lag en skill når du tar deg selv i å forklare det samme for tredje gang.",
          { heading: "Gode kandidater" },
          {
            list: [
              "Oppgaver du gjør ukentlig: statusrapporter, nyhetsbrev, produktbeskrivelser.",
              "Ting med faste regler: tone of voice, maler, sjekklister.",
              "Rutiner flere i bedriften skal gjøre likt.",
            ],
          },
          { heading: "Dropp skill når" },
          {
            list: [
              "Oppgaven er et engangstilfelle – da holder en vanlig melding.",
              "Oppskriften endrer seg hver gang – da blir skillen utdatert før du får brukt den.",
            ],
          },
          "Gjør-selv-oppgaven under er kursets viktigste: lista di derfra blir råmaterialet for resten av kurset.",
        ],
        steps: [
          {
            title: "Finn dine tre skill-kandidater",
            body: [
              "Ta fram et ark eller et tomt dokument og svar ærlig: hvilke tre oppgaver forklarer du Claude (eller en kollega) oftest?",
            ],
            substeps: [
              "Skriv ned tre oppgaver du gjør minst én gang i uka med hjelp av AI.",
              "Marker den du bruker mest tid på å forklare.",
              "Ta vare på lista – du bruker den i modul 3.",
            ],
          },
        ],
      },
    ],
  },
  {
    title: "Slå på skills og prøv de ferdige",
    lessons: [
      {
        title: "Slå på skills i Claude",
        content: [
          "Skills må skrus på én gang før du kan bruke dem. Det gjør du i innstillingene, og det tar under et minutt. Følg stegene under i din egen Claude-app eller på claude.ai.",
        ],
        steps: [
          {
            title: "Åpne innstillingene",
            body: [
              "Klikk på initialene eller profilbildet ditt nede i hjørnet og velg innstillinger (Settings).",
            ],
            substeps: [
              "Åpne Claude-appen eller claude.ai og logg inn.",
              "Gå til innstillinger via menyen på profilen din.",
            ],
          },
          {
            title: "Skru på skills",
            body: [
              "Finn fram til funksjoner/muligheter (Capabilities/Features) i innstillingene. Der ligger en bryter for skills – og den henger sammen med at Claude får lov til å kjøre kode og lage filer, så begge må være på.",
            ],
            substeps: [
              "Åpne Capabilities/Features i innstillingene.",
              "Slå på bryteren for skills (og kodekjøring/filoppretting hvis Claude ber om det).",
            ],
          },
          {
            title: "Sjekk at det virker",
            body: [
              "Start en ny samtale og be Claude lage en enkel Excel-fil, for eksempel «lag et regneark med et enkelt budsjett for en kafé». Ser du at Claude nevner at den bruker en skill og leverer en fil du kan laste ned, er alt på plass.",
            ],
            substeps: [
              "Start en ny samtale.",
              "Be om en Excel-fil eller PowerPoint og se at Claude tar i bruk en skill.",
            ],
          },
        ],
      },
      {
        title: "De ferdige skillene fra Anthropic",
        content: [
          "Med skills påslått har du allerede noen ferdige fra Anthropic – de lager ordentlige filer i stedet for bare tekst i samtalen:",
          {
            list: [
              "Excel-regneark med formler som faktisk regner – budsjetter, prislister, oversikter.",
              "PowerPoint-presentasjoner med lysbilder du kan redigere etterpå.",
              "Word-dokumenter med skikkelig formatering – tilbud, kontrakter, brev.",
              "PDF-er som er klare til å sendes eller printes.",
            ],
          },
          "Det fine er at du ikke trenger å velge noe: be om «en presentasjon på fem lysbilder om …», så finner Claude riktig skill selv. Prøv én av dem på en ekte oppgave fra din egen hverdag før du går videre – det gir deg følelsen av hva en skill gjør.",
        ],
      },
      {
        title: "Finn skills andre har laget",
        content: [
          "Du trenger ikke lage alt selv. Mange deler ferdige skills du kan laste ned og tilpasse – men som med alt du henter fra nettet, lønner det seg å se hvor det kommer fra.",
          { heading: "Hvor du leter" },
          {
            list: [
              "Søk på «claude skills» pluss oppgaven din, for eksempel «claude skills markedsføring».",
              "Anthropic sine egne eksempler og dokumentasjon er tryggest å starte med.",
              "GitHub er hovedkilden ellers – skills ligger som mapper med en SKILL.md-fil, ofte pakket som zip.",
            ],
          },
          { heading: "Før du laster opp noe" },
          {
            list: [
              "Åpne og les instruksjonsfila – den er vanlig tekst, og du skal forstå hva den ber Claude om å gjøre.",
              "Hopp over skills med skript eller kode du ikke skjønner hensikten med.",
              "Sjekk at den er oppdatert i det siste – gamle skills kan peke på ting som har endret seg.",
            ],
          },
        ],
      },
    ],
  },
  {
    title: "Lag din egen skill",
    lessons: [
      {
        title: "Skriv skillen for din egen rutineoppgave",
        content: [
          "Hent fram lista fra modul 1. Nå tar du oppgaven du markerte og gjør den om til en skill. Det enkleste er å la Claude hjelpe deg – be den rett og slett om å lage en skill sammen med deg.",
          "Det viktigste rådet: vær konkret i oppskriften. «Skriv et godt nyhetsbrev» hjelper ingen. «Start med én konkret kundehistorie, maks 300 ord, avslutt med ett tydelig tips» – det kan Claude følge.",
        ],
        steps: [
          {
            title: "Fra huskeliste til oppskrift",
            body: [
              "Skriv ned hvordan du faktisk gjør oppgaven i dag, punkt for punkt. Det du ville sagt til en ny ansatt første uka – det er skillen din.",
            ],
            substeps: [
              "List opp stegene du gjør manuelt i dag.",
              "Legg til krav til resultatet: lengde, tone, faste avsnitt.",
            ],
          },
          {
            title: "La Claude bygge skillen",
            body: [
              "Start en ny samtale og be Claude lage en skill av oppskriften din: «Lag en skill som skriver nyhetsbrevet vårt slik: …». Claude setter opp fila i riktig format – en SKILL.md med navn og en kort beskrivelse øverst, og oppskriften din under. Beskrivelsen er viktigst: det er den Claude leser når den avgjør om skillen passer til det du ber om.",
            ],
            substeps: [
              "Lim inn oppskriften din og be Claude lage en skill av den.",
              "Les gjennom det Claude foreslår og juster beskrivelsen så den treffer oppgaven presist.",
              "Last ned skillen som zip-fil.",
            ],
          },
          {
            title: "Last opp og test",
            body: [
              "Gå til skills-oversikten i innstillingene og last opp zip-fila. Start så en ny samtale og be om oppgaven med vanlige ord – for eksempel «lag ukens nyhetsbrev». Ser du at Claude nevner skillen din og følger oppskriften, er den i drift.",
            ],
            substeps: [
              "Last opp zip-fila under skills i innstillingene.",
              "Test med en ekte oppgave i en ny samtale.",
              "Mangler noe? Juster teksten og last opp på nytt.",
            ],
          },
        ],
      },
      {
        title: "Gode vaner: vedlikehold og deling",
        content: [
          "En skill er ferskvare på samme måte som rutinene dine. Når måten dere jobber på endrer seg, oppdaterer du skillen – det tar noen minutter.",
          {
            list: [
              "Les gjennom skillene dine når rutinen endres – ikke la dem råtne.",
              "Del zip-fila med kollegene, så jobber alle etter samme oppskrift.",
              "Slett skills du ikke bruker – få og gode slår mange og halvgode.",
            ],
          },
          "Det var kurset! Du vet nå hva en skill er, du har prøvd de ferdige, laget din egen og har en liste over de neste. Neste gang du forklarer Claude det samme for tredje gang, vet du hva du gjør i stedet.",
        ],
      },
    ],
  },
];

const data: CourseData = {
  title: "Kom i gang med skills i Claude",
  slug: SLUG,
  excerpt:
    "Lær å lagre rutineoppgavene dine som skills i Claude – oppskrifter Claude finner fram selv, så du slipper å forklare det samme om og om igjen.",
  publishedAt: new Date("2026-08-04T09:00:00.000Z").toISOString(),
  isFeatured: false,
  modules: MODULES.map((mod) => ({
    title: mod.title,
    lessons: mod.lessons.map((lesson) => ({
      title: lesson.title,
      content: richDoc(lesson.content) as unknown as NonNullable<
        NonNullable<CourseData["modules"]>[number]["lessons"]
      >[number]["content"],
      steps: (lesson.steps ?? []).map((step) => ({
        title: step.title,
        body: richDoc(step.body) as unknown as Record<string, unknown>,
        substeps: (step.substeps ?? []).map((text) => ({ text })),
      })),
    })),
  })) as CourseData["modules"],
  _status: "published",
};

const existing = await payload.find({
  collection: "courses",
  where: { slug: { equals: SLUG } },
  limit: 1,
});

if (existing.docs.length > 0) {
  await payload.update({
    collection: "courses",
    id: existing.docs[0].id,
    data,
  });
  payload.logger.info(`Oppdaterte kurs: ${data.title}`);
} else {
  await payload.create({ collection: "courses", data });
  payload.logger.info(`Opprettet kurs: ${data.title}`);
}

process.exit(0);
