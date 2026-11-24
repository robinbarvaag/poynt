/**
 * Navnet en broadcast får i Resend-lista (bare til internt bruk — mottakerne
 * ser emnet, ikke navnet). Resend avviser navn over 70 tegn («The name field
 * must not have more than 70 characters», skjedde 24.11.2026 med et langt
 * emne), mens emnet gjerne kan være lengre. Navnet kortes derfor ned; emnet
 * sendes urørt.
 */
export const BROADCAST_NAME_MAX = 70;

/** Kutt til `max` tegn uten å dele et emoji-par i to. */
function cut(text: string, max: number): string {
  let out = "";
  for (const char of text) {
    if (out.length + char.length > max) break;
    out += char;
  }
  return out;
}

/**
 * `prefix`/`suffix` (f.eks. «[TEST] » eller « (Ettersending)») beholdes hele —
 * det er emnet i midten som forkortes med «…».
 */
export function broadcastName(
  subject: string,
  { prefix = "", suffix = "" }: { prefix?: string; suffix?: string } = {}
): string {
  const full = `${prefix}${subject.trim()}${suffix}`;
  if (full.length <= BROADCAST_NAME_MAX) return full;

  const room = BROADCAST_NAME_MAX - prefix.length - suffix.length - 1;
  // Urimelig langt segmentnavn: da er det ikke plass til emnet — kutt alt.
  if (room < 10) return `${cut(full, BROADCAST_NAME_MAX - 1).trimEnd()}…`;
  return `${prefix}${cut(subject.trim(), room).trimEnd()}…${suffix}`;
}
