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
 * roboter fyller ut fordi de bare leser HTML-en. Samme navn som i
 * påmeldingsskjemaet for eventer, så det er ett begrep å huske.
 */
export const HONEYPOT_FIELD = "website";

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
