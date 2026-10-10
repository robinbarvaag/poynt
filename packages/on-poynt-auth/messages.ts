/**
 * Tekster som deles mellom server (API-feil) og innloggingssida (klient).
 * Egen fil uten server-imports, så klienten kan hente den trygt.
 */

/**
 * Vist når noen prøver å logge inn med en e-post som ikke har konto —
 * fra magic link-hooken på serveren og for Google (?error=signup_disabled).
 */
export const UNKNOWN_MEMBER_MESSAGE =
  "Vi finner ingen godkjent medlemskonto på denne e-posten. Bruk e-posten du søkte med, eller søk om medlemskap først.";
