/**
 * Lager en NY, SKJULT eksempelside med én av hver vekst-blokk, fylt med
 * innhold fra «Verdifull vekst». Susanne ser den i forhåndsvisning og legger
 * blokkene hun vil ha inn på sin egen ressursside via «Legg til blokk».
 *
 * Create-only: finnes siden fra før, gjør scriptet INGENTING (se seed-policyen,
 * Susanne redigerer innholdet selv). Opprettes som utkast med en adresse som
 * ikke kan gjettes (`unlisted`).
 *
 *   bun run --cwd apps/web payload run scripts/seed-vekst-eksempler.ts
 */
import config from "@payload-config";
import { getPayload } from "payload";
import {
  CHANGE_WHEEL_AI_PROMPT,
  FORECAST_MONTHLY_NEED,
  HOURLY_MULTIPLIER,
  PROFIT_EXAMPLE,
  SALES_RITUAL,
  changeWheelAreasCms,
  chapterDoorsCms,
  mythsCms,
  ritualChecklistCms,
  vekstPillarsCms,
  workflowsCms,
} from "../lib/vekst/book-content";

const PAGE_TITLE = "Verdifull Vekst-universet – nye elementer (forslag)";

const payload = await getPayload({ config });

const existing = await payload.find({
  collection: "pages",
  where: { title: { equals: PAGE_TITLE } },
  limit: 1,
  depth: 0,
  draft: true,
});

if (existing.docs.length > 0) {
  payload.logger.info(
    `Finnes allerede, rører den ikke: ${PAGE_TITLE} (/${existing.docs[0].slug})`
  );
  process.exit(0);
}

// Blokk-navnene blir ankrene som lenkene i book-content peker på.
const layout = [
  {
    blockType: "chapterPortal",
    blockName: "Kapitlene",
    eyebrow: "Verdifull vekst",
    title: "Velg en dør",
    intro:
      "Hvert kapittel i boka har et verktøy du kan prøve her. Dørene du har gått gjennom, står på gløtt.",
    doors: chapterDoorsCms(),
    palette: "book",
  },
  {
    blockType: "vekstCheck",
    blockName: "VEKST-sjekken",
    eyebrow: "VEKST-modellen",
    title: "Hvor står bedriften din?",
    intro:
      "Femten korte spørsmål, tre for hver bokstav. Ta dem på magefølelsen.",
    pillars: vekstPillarsCms(),
    palette: "book",
  },
  {
    blockType: "changeWheel",
    blockName: "Endringshjulet",
    eyebrow: "Endring",
    title: "Endringshjulet",
    intro:
      "Svar ja eller nei på tre spørsmål for hvert område. 0–1 ja blir rosa: der starter du. 2 ja blir gult, og 3 ja grønt.",
    areas: changeWheelAreasCms(),
    aiPrompt: CHANGE_WHEEL_AI_PROMPT,
    palette: "book",
  },
  {
    blockType: "growthCalculator",
    blockName: "Lønnsomhet",
    calculator: "profit",
    eyebrow: "Tall",
    title: "Tjener du penger på det du selger?",
    intro:
      "Skriv inn prisen kunden betaler og alle kostnadene for å levere. Boka regner 30–60 % som god lønnsomhet.",
    profitExample: { ...PROFIT_EXAMPLE },
    footnote: "Tallene blir i nettleseren din. Ingenting sendes.",
    palette: "book",
  },
  {
    blockType: "growthCalculator",
    blockName: "Timepris",
    calculator: "hourly",
    eyebrow: "Tall",
    title: "Hva må timeprisen din være?",
    intro:
      "Lønnen du vil ha, med påslag, pluss kostnadene dine, delt på timene du faktisk kan fakturere.",
    multiplier: HOURLY_MULTIPLIER,
    palette: "book",
  },
  {
    blockType: "growthCalculator",
    blockName: "Spåkula",
    calculator: "forecast",
    eyebrow: "Salg",
    title: "Spåkula for salg",
    intro:
      "Før inn inntektene du vet kommer (grønt) og dem du antar kommer (gult). Da ser du hvilke måneder som trenger ekstra salgsinnsats. Eksempelet er hagesenteret fra boka.",
    monthlyNeed: FORECAST_MONTHLY_NEED,
    palette: "book",
  },
  {
    blockType: "mythCards",
    blockName: "Ti løgner",
    eyebrow: "Del 3",
    title: "Ti løgner som kan hindre vekst",
    intro: "Snu kortene og se hva som faktisk stemmer.",
    myths: mythsCms(),
    palette: "book",
  },
  {
    blockType: "aiWorkflow",
    blockName: "Arbeidsflyter med KI",
    eyebrow: "KI",
    title: "Arbeidsflyter med KI",
    intro:
      "Slik bruker jeg KI i bedriften. Trykk «Kjør eksempelet» for å se hva du kan få tilbake, og åpne prompten rett i ChatGPT eller Claude.",
    workflows: workflowsCms(),
    palette: "book",
  },
  {
    blockType: "salesRitual",
    blockName: "Omsetnings-onsdag",
    eyebrow: "Salg",
    title: "Omsetnings-onsdag",
    intro:
      "Gi salgsinnsatsen en fast plass i uka, og et navn. Legg den rett i kalenderen.",
    ritualName: SALES_RITUAL.ritualName,
    weekday: SALES_RITUAL.weekday,
    startTime: SALES_RITUAL.startTime,
    durationMinutes: SALES_RITUAL.durationMinutes,
    quote: SALES_RITUAL.quote,
    checklist: ritualChecklistCms(),
    calendarDescription: SALES_RITUAL.calendarDescription,
    palette: "book",
  },
];

const created = await payload.create({
  collection: "pages",
  data: {
    title: PAGE_TITLE,
    pageType: "hub",
    unlisted: true,
    layout,
    meta: {
      title: "Verdifull vekst – verktøy",
      description:
        "Interaktive verktøy fra boka «Verdifull vekst»: kalkulatorer, endringshjulet, VEKST-sjekken og mer.",
      noIndex: true,
    },
    _status: "draft",
    // biome-ignore lint/suspicious/noExplicitAny: seed-data matcher blokk-skjemaene
  } as any,
  draft: true,
});

payload.logger.info(
  `Opprettet utkast: ${PAGE_TITLE} → /${created.slug} (forhåndsvis i admin)`
);

process.exit(0);
