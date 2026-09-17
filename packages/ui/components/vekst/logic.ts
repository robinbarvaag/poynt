/**
 * Regnestykkene og vurderingene fra «Verdifull vekst», som rene funksjoner.
 * Ingen React her, så de kan testes direkte (`logic.test.ts`) og brukes likt
 * i alle vekst-blokkene.
 */

/** Bokas fargesoner: rosa = start her, gul = nummer to, grønn = sterkt. */
export type Zone = "rosa" | "gul" | "gronn";

// ---------------------------------------------------------------------------
// Lønnsomhet
// ---------------------------------------------------------------------------

/**
 * Lønnsomhet i prosent: (pris − kostnader) ÷ pris × 100. `null` når prisen
 * ikke er et positivt tall (da finnes det ingen meningsfull prosent).
 */
export function profitPercent(price: number, costs: number): number | null {
  if (!Number.isFinite(price) || price <= 0) return null;
  const safeCosts = Number.isFinite(costs) ? costs : 0;
  return ((price - safeCosts) / price) * 100;
}

/** `tap` under 0, `tynt` under 30, `bra` 30–60 (bokas «god lønnsomhet»), `hoy` over 60. */
export type ProfitVerdict = "tap" | "tynt" | "bra" | "hoy";

export function profitVerdict(percent: number): ProfitVerdict {
  if (percent < 0) return "tap";
  if (percent < 30) return "tynt";
  if (percent <= 60) return "bra";
  return "hoy";
}

export function profitZone(verdict: ProfitVerdict): Zone {
  if (verdict === "tap") return "rosa";
  if (verdict === "tynt") return "gul";
  return "gronn";
}

// ---------------------------------------------------------------------------
// Timepris
// ---------------------------------------------------------------------------

export interface HourlyRateInput {
  /** Lønnen du vil ta ut i året. */
  annualSalary: number;
  /** Påslag på lønnen (boka: ×1,5 i AS). */
  multiplier: number;
  /** Andre kostnader i året (lokaler, verktøy, regnskap …). */
  otherCosts: number;
  /** Arbeidsuker i året (etter ferie og fridager). */
  workWeeks: number;
  hoursPerWeek: number;
  /** Andel av tida som faktisk kan faktureres, 0–100. */
  billableShare: number;
}

const nonNegative = (value: number) =>
  Number.isFinite(value) && value > 0 ? value : 0;

export function billableHours(input: HourlyRateInput): number {
  const share = Math.min(100, nonNegative(input.billableShare)) / 100;
  return nonNegative(input.workWeeks) * nonNegative(input.hoursPerWeek) * share;
}

/** Hva lønn med påslag og kostnader koster i året. */
export function yearlyCost(input: HourlyRateInput): number {
  return (
    nonNegative(input.annualSalary) * nonNegative(input.multiplier) +
    nonNegative(input.otherCosts)
  );
}

/** Timeprisen du må ta for å dekke lønn og kostnader. `null` uten fakturerbare timer. */
export function hourlyRate(input: HourlyRateInput): number | null {
  const hours = billableHours(input);
  if (hours <= 0) return null;
  return yearlyCost(input) / hours;
}

// ---------------------------------------------------------------------------
// Ja/nei-sjekker (endringshjulet, VEKST-sjekken)
// ---------------------------------------------------------------------------

/**
 * Fargesone for et område ut fra antall ja. Med bokas tre spørsmål blir det
 * 0–1 ja = rosa, 2 ja = gul, 3 ja = grønn. Andre antall skaleres likt: alle ja
 * er grønt, minst to tredjedeler er gult, resten rosa.
 */
export function zoneForYes(yes: number, total: number): Zone {
  if (total <= 0) return "rosa";
  if (yes >= total) return "gronn";
  if (yes / total >= 2 / 3 - 1e-9) return "gul";
  return "rosa";
}

/** Endringshjulet har tre ringer per område, som i boka. */
export const WHEEL_RING_COUNT = 3;

/**
 * Hvor mange av ringene i endringshjulet som er fylt. Med bokas tre spørsmål
 * tegner hvert ja én ring til, utenfra og inn. Med andre antall spørsmål
 * fordeles ringene jevnt, og alle ja må til for å nå helt inn i midten.
 */
export function ringsForYes(
  yes: number,
  total: number,
  rings = WHEEL_RING_COUNT
): number {
  if (total <= 0 || yes <= 0) return 0;
  if (yes >= total) return rings;
  return Math.min(rings - 1, Math.floor((yes / total) * rings));
}

/**
 * Minste antall ja som trengs for å tegne ring nummer `ring` (1 = ytterst).
 * Brukes i forklaringen: «1 ja», «2 ja», «3 ja». `null` utenfor skalaen.
 */
export function yesForRing(
  ring: number,
  total: number,
  rings = WHEEL_RING_COUNT
): number | null {
  if (total <= 0 || ring < 1 || ring > rings) return null;
  for (let yes = 1; yes <= total; yes++) {
    if (ringsForYes(yes, total, rings) >= ring) return yes;
  }
  return null;
}

export interface YesScore {
  yes: number;
  total: number;
}

const ratio = ({ yes, total }: YesScore) => (total > 0 ? yes / total : 0);

/** Indeksen til det svakeste området (første ved likt). −1 for tom liste. */
export function weakestIndex(scores: YesScore[]): number {
  let best = -1;
  for (const [i, score] of scores.entries()) {
    if (best === -1 || ratio(score) < ratio(scores[best])) best = i;
  }
  return best;
}

/** Indeksen til det sterkeste området (første ved likt). −1 for tom liste. */
export function strongestIndex(scores: YesScore[]): number {
  let best = -1;
  for (const [i, score] of scores.entries()) {
    if (best === -1 || ratio(score) > ratio(scores[best])) best = i;
  }
  return best;
}

/** Teller ja i en liste svar der `null` er ubesvart. */
export function countYes(answers: (boolean | null)[]): number {
  let yes = 0;
  for (const answer of answers) if (answer === true) yes++;
  return yes;
}

// ---------------------------------------------------------------------------
// Spåkula for salg
// ---------------------------------------------------------------------------

export interface ForecastMonth {
  /** Inntekter du vet kommer (grønt i boka). */
  sure: number;
  /** Inntekter du antar kommer (gult i boka). */
  likely: number;
}

/**
 * `tomt` = ingenting fylt inn, `dekket` = det sikre holder, `kanskje` = holder
 * bare hvis det antatte også kommer, `under` = må ha ekstra salgsinnsats.
 */
export type MonthStatus = "tomt" | "dekket" | "kanskje" | "under";

export function monthStatus(month: ForecastMonth, need: number): MonthStatus {
  const sure = nonNegative(month.sure);
  const likely = nonNegative(month.likely);
  if (sure + likely === 0) return "tomt";
  if (sure >= need) return "dekket";
  if (sure + likely >= need) return "kanskje";
  return "under";
}

// ---------------------------------------------------------------------------
// Diverse
// ---------------------------------------------------------------------------

/** ISO-uke som nøkkel, f.eks. «2026-W38». Brukes til å nullstille ukelister. */
export function isoWeekKey(date: Date): string {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

const nokFormat = new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 0 });

/** «1 250 kr». */
export function formatKr(value: number): string {
  return `${nokFormat.format(Math.round(value))} kr`;
}

/** Tall uten enhet, med norsk tusenskille. */
export function formatNumber(value: number): string {
  return nokFormat.format(Math.round(value));
}

const inputFormat = new Intl.NumberFormat("nb-NO", {
  maximumFractionDigits: 2,
});

/**
 * Pynter på det som er skrevet i et tallfelt: «40000» → «40 000», «37.5» →
 * «37,5». Tomt blir tomt, og alt som ikke er et rent, positivt tall står
 * urørt, så vi aldri sletter noe leseren har skrevet.
 */
export function formatInput(raw: string): string {
  const cleaned = raw.replace(/\s/g, "").replace(",", ".");
  if (cleaned === "") return "";
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return raw;
  return inputFormat.format(Number(cleaned));
}

/** Tolker et tall skrevet med komma eller mellomrom («1 250,5»). */
export function parseNumber(raw: string): number {
  const cleaned = raw.replace(/[\s ]/g, "").replace(",", ".");
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? value : 0;
}
