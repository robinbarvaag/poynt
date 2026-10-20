/**
 * Fylke fra postnummer. Norske postnummer er geografisk ordnet, så de to
 * første sifrene peker nesten alltid på ett fylke. Det er «nesten»: noen
 * grenser går midt i et hundre (3000–3099 Drammen er Buskerud, 3100–3299 er
 * Vestfold, 3300 Hokksund er Buskerud igjen), og tabellen under følger de
 * grensene så godt det lar seg gjøre uten et fullt postnummerregister.
 *
 * Brukes for kjeder som ikke oppgir fylke selv (ARK gir bare by og kommune),
 * så butikkene deres kan stå i samme fylkestabell som Norlis. Feil fylke på en
 * enkelt butikk er en skjønnhetsfeil, ikke en tellefeil — beholdningen følger
 * butikken, ikke fylket.
 */

/** [fra, til] inklusive, på de fire sifrene som tall. */
const RANGES: [number, number, string][] = [
  [0, 1299, "Oslo"],
  [1300, 1499, "Akershus"],
  [1500, 1899, "Østfold"],
  [1900, 2199, "Akershus"],
  [2200, 2999, "Innlandet"],
  [3000, 3099, "Buskerud"],
  [3100, 3299, "Vestfold"],
  [3300, 3699, "Buskerud"],
  [3700, 3999, "Telemark"],
  [4000, 4399, "Rogaland"],
  [4400, 4999, "Agder"],
  [5000, 5999, "Vestland"],
  [6000, 6699, "Møre og Romsdal"],
  [6700, 6999, "Vestland"],
  [7000, 7999, "Trøndelag"],
  [8000, 8999, "Nordland"],
  [9000, 9499, "Troms"],
  [9500, 9999, "Finnmark"],
];

export function regionFromPostcode(
  postcode: string | null | undefined
): string | undefined {
  const digits = postcode?.trim();
  if (!digits || !/^\d{4}$/.test(digits)) return undefined;
  const value = Number(digits);
  return RANGES.find(([from, to]) => value >= from && value <= to)?.[2];
}
