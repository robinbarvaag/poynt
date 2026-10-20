/**
 * Datoer i boksalg-sporinga regnes i norsk tid, ikke i serverens.
 *
 * Vercel kjører i UTC. Uten eksplisitt tidssone ville en henting kl. 00:30
 * norsk tid havnet på gårsdagens dag i grafene, og «sist hentet 06:00» ville
 * stått der boka ble hentet 08:00. Verre: serveren og nettleseren ville
 * formatert samme tidspunkt ulikt, og React klager på hydreringsavvik.
 */

export const BOOK_TIME_ZONE = "Europe/Oslo";

const DAY_KEY = new Intl.DateTimeFormat("sv-SE", {
  timeZone: BOOK_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** «2026-10-15» for et tidspunkt, regnet i norsk tid. */
export function dayKey(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  // sv-SE gir ISO-format (ÅÅÅÅ-MM-DD) uten at vi må sette det sammen selv.
  return DAY_KEY.format(date);
}

/** Antall hele dager fra i dag (norsk tid) til en dagnøkkel. Negativt = passert. */
export function daysFromToday(targetDay: string, now = new Date()): number {
  const today = dayKey(now);
  return Math.round(
    (Date.parse(`${targetDay}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) /
      86_400_000
  );
}

/**
 * Alle dagnøkler fra `from` til og med `to` («2026-10-13», «2026-10-14», …).
 * Brukes til å fylle tidslinjene med tomme dager, så en dag uten bevegelse
 * vises som et hull i grafen i stedet for å forsvinne fra aksen.
 */
export function eachDay(from: string, to: string): string[] {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end) || start > end) return [];
  const days: string[] = [];
  for (let t = start; t <= end; t += 86_400_000) {
    days.push(new Date(t).toISOString().slice(0, 10));
  }
  return days;
}
