/**
 * Google reCAPTCHA v3 — serverside-verifisering.
 *
 * v3 viser ingen «klikk på bildene»-oppgave: nettleseren henter et token i
 * bakgrunnen, og Google gir oss en score mellom 0.0 (sannsynligvis bot) og
 * 1.0 (sannsynligvis menneske). Vi avviser alt under terskelen.
 *
 * Ligger i @poynt/utils fordi både Next-API-rutene, Payload-konfigurasjonen
 * og innloggingen (@poynt/planner-auth) må kunne sjekke det samme tokenet.
 *
 * Uten RECAPTCHA_SECRET_KEY slipper alt gjennom (fail open) — nettstedet skal
 * ikke slutte å ta imot skjemaer fordi en nøkkel mangler. Raten-grensene i
 * lib/rate-limit.ts står uansett igjen som brems.
 */

// @poynt/utils har ikke @types/node (resten av pakka kjører også i nettleseren).
// Denne fila er serverside-only, så vi deklarerer bare det vi trenger.
declare const process: { env: Record<string, string | undefined> };

const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

/**
 * HTTP-headeren tokenet sendes med. Ligger her fordi klienten, API-rutene,
 * Payload og innloggingen alle må bli enige om samme navn — og denne fila er
 * det eneste de tre siste har felles.
 */
export const RECAPTCHA_HEADER = "x-recaptcha-token";

/** Standardterskel. Google anbefaler 0.5 som utgangspunkt. */
const DEFAULT_MIN_SCORE = 0.5;

export type RecaptchaReason =
  | "ok"
  | "not-configured"
  | "missing-token"
  | "invalid-token"
  | "wrong-action"
  | "low-score"
  | "network-error";

export interface RecaptchaResult {
  /** true = slipp gjennom. Gjelder også når reCAPTCHA ikke er satt opp. */
  ok: boolean;
  reason: RecaptchaReason;
  score?: number;
  action?: string;
  /** Feilkoder fra Google, f.eks. «timeout-or-duplicate». */
  errorCodes?: string[];
}

/** Er reCAPTCHA skrudd på i dette miljøet? */
export function isRecaptchaConfigured(): boolean {
  return Boolean(process.env.RECAPTCHA_SECRET_KEY);
}

function minScore(): number {
  const raw = Number(process.env.RECAPTCHA_MIN_SCORE);
  return Number.isFinite(raw) && raw >= 0 && raw <= 1 ? raw : DEFAULT_MIN_SCORE;
}

export interface VerifyOptions {
  /**
   * Handlingsnavnet klienten ba om tokenet med (f.eks. «nyhetsbrev»). Sjekkes
   * mot svaret fra Google, slik at et token hentet på ett skjema ikke kan
   * gjenbrukes mot et annet endepunkt.
   */
  action: string;
  /** Klientens IP, hvis vi har den. Gjør Googles vurdering litt bedre. */
  remoteIp?: string;
  /** Overstyr terskelen for enkeltendepunkter (f.eks. strengere på innlogging). */
  minScore?: number;
}

/**
 * Sjekker et reCAPTCHA v3-token mot Google.
 *
 * Kaster aldri: nettverksfeil mot Google skal ikke gjøre skjemaet ubrukelig,
 * så de logges og slipper gjennom.
 */
export async function verifyRecaptcha(
  token: string | null | undefined,
  options: VerifyOptions
): Promise<RecaptchaResult> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return { ok: true, reason: "not-configured" };

  if (!token) return { ok: false, reason: "missing-token" };

  const body = new URLSearchParams({ secret, response: token });
  if (options.remoteIp && options.remoteIp !== "ukjent") {
    body.set("remoteip", options.remoteIp);
  }

  let data: {
    success?: boolean;
    score?: number;
    action?: string;
    "error-codes"?: string[];
  };

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      // Googles endepunkt skal aldri cachet av noen mellomledd.
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    data = await res.json();
  } catch (error) {
    console.warn("[recaptcha] kunne ikke nå Google, slipper gjennom:", error);
    return { ok: true, reason: "network-error" };
  }

  const errorCodes = data["error-codes"];

  if (!data.success) {
    return { ok: false, reason: "invalid-token", errorCodes };
  }

  // Google returnerer handlingsnavnet tokenet ble laget med.
  if (data.action && data.action !== options.action) {
    return {
      ok: false,
      reason: "wrong-action",
      action: data.action,
      score: data.score,
    };
  }

  // v3 gir alltid en score. Mangler den, er nøkkelen en v2-nøkkel (eller
  // Google har endret svaret) — og da ville en streng sjekk stoppet hvert
  // eneste skjema på nettstedet uten at noen skjønte hvorfor. Slipp gjennom
  // og rop høyt i loggen i stedet.
  if (typeof data.score !== "number") {
    console.warn(
      "[recaptcha] svar uten score — er RECAPTCHA_SECRET_KEY en v3-nøkkel? Slipper gjennom."
    );
    return { ok: true, reason: "ok", action: data.action };
  }

  const threshold = options.minScore ?? minScore();

  if (data.score < threshold) {
    return {
      ok: false,
      reason: "low-score",
      score: data.score,
      action: data.action,
    };
  }

  return { ok: true, reason: "ok", score: data.score, action: data.action };
}

/** Norsk feilmelding til brukeren når et token blir avvist. */
export function recaptchaErrorMessage(reason: RecaptchaReason): string {
  if (reason === "missing-token") {
    return "Vi fikk ikke bekreftet at du er et menneske. Last siden på nytt og prøv igjen.";
  }
  return "Innsendingen ble stoppet av spamfilteret vårt. Last siden på nytt og prøv igjen.";
}
