/**
 * Spamfiltre som ikke er avhengige av Google.
 *
 * reCAPTCHA v3 er en score, ikke en vegg: en bot som kjører en ekte nettleser
 * får et gyldig token, og scorer den over terskelen slipper den inn. Det
 * skjedde 20.09.2026 — to innsendinger kom gjennom med gyldig token. Disse
 * sjekkene er laget for å ta akkurat det tilfellet.
 */

/**
 * Navnet på honningkrukke-feltet: et skjult felt mennesker aldri ser, men som
 * roboter fyller ut fordi de bare leser HTML-en. Samme navn i alle skjemaer
 * (kontakt, nyhetsbrev, påmelding), så det er ett begrep å huske.
 *
 * Het «website» fram til 20.09.2026. Det var et dårlig navn: passordbehandlere
 * og nettleser-autofyll kjenner igjen «website»/«url» og fyller feltet selv om
 * det står `autoComplete="off"` — da blir et ekte menneske avvist som robot.
 * Navnet her skal derfor IKKE være noe autofyll har hørt om.
 */
export const HONEYPOT_FIELD = "kontaktmetode_2";

/** Er honningkrukka fylt ut? Da er det en robot. */
export function isHoneypotFilled(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Kjenner igjen tastaturmos som «TsPGxDXqnGBjjEtgnZ» — spamboter som fyller
 * navnefeltet med tilfeldige tegn.
 *
 * Signalet er antall store bokstaver som står MIDT i et ord, rett etter en
 * liten. Et ekte navn har null slike: «Robin Barvåg», «MARIT HANSEN» og
 * «van der Berg» gir alle 0, og «McDonald» gir 1. Norske sammensatte ord
 * («arbeidsmiljøutvalget») er lange, men har ingen store bokstaver inni — som
 * er grunnen til at vi teller kasusskifter og ikke lengde eller vokalandel.
 * Tre eller flere er praktisk talt umulig i et ekte navn.
 */
export function looksLikeGibberish(value: string): boolean {
  for (const word of value.trim().split(/\s+/)) {
    // Korte ord gir for lite å gå på — «McDo» skal aldri kunne utløse noe.
    if (word.length < 8) continue;

    let flips = 0;
    for (let i = 1; i < word.length; i++) {
      const prev = word[i - 1];
      const current = word[i];
      const prevIsLower =
        prev !== prev.toUpperCase() && prev === prev.toLowerCase();
      const currentIsUpper =
        current !== current.toLowerCase() && current === current.toUpperCase();
      if (prevIsLower && currentIsUpper) flips++;
    }

    if (flips >= 3) return true;
  }

  return false;
}

/** Kutt lange verdier så én logglinje holder seg lesbar. */
function truncate(value: string, max: number): string {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

/**
 * Lager én logglinje som viser hva som faktisk ble sendt inn, og hvem som
 * sendte det. Uten dette står det bare «avvist» i Vercel-loggen, og det er
 * umulig å si i ettertid om filteret tok en robot eller et ekte menneske.
 *
 * Verdiene er kuttet, og innholdet er uansett noe som ALDRI ble lagret — det
 * er den eneste kopien vi har av en avvist innsending.
 */
export function describeSubmission(
  fields: Record<string, unknown>,
  headers?: { get(name: string): string | null } | null
): string {
  const felt = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}="${truncate(String(value), 120)}"`)
    .join(" ");

  if (!headers) return felt;

  const ip =
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "ukjent";
  const ua = truncate(headers.get("user-agent") ?? "ukjent", 140);
  const referer = headers.get("referer") ?? "ukjent";

  return `${felt} — ip=${ip} referer="${referer}" ua="${ua}"`;
}
