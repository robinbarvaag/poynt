/**
 * Samtykke til informasjonskapsler (cookies).
 *
 * Valget lagres i en førstepartscookie (ikke bare localStorage) med
 * tidsstempel og versjon. Bump CONSENT_VERSION hvis kategoriene endres, så
 * alle blir spurt på nytt.
 *
 * Kategorier:
 *  - Nødvendige: alltid på (handlekurv, innlogging, betaling). Ikke lagret her.
 *  - analytics:  Google Analytics 4. Lastes kun etter aktivt samtykke.
 */

export const CONSENT_COOKIE = "poynt-consent";
export const CONSENT_VERSION = 1;
/** 6 måneder — Datatilsynet anbefaler å spørre på nytt minst årlig. */
const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 182;

export type ConsentCategory = "analytics";

export type ConsentCategories = Record<ConsentCategory, boolean>;

export interface ConsentState {
  version: number;
  /** ISO-tidspunkt for når valget ble tatt. */
  timestamp: string;
  categories: ConsentCategories;
}

export const ALL_DENIED: ConsentCategories = { analytics: false };
export const ALL_GRANTED: ConsentCategories = { analytics: true };

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  for (const part of document.cookie.split("; ")) {
    if (part.startsWith(prefix)) {
      return decodeURIComponent(part.slice(prefix.length));
    }
  }
  return null;
}

/** Leser lagret samtykke. `null` = ikke tatt stilling (eller utdatert versjon). */
export function readConsent(): ConsentState | null {
  const raw = readCookie(CONSENT_COOKIE);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    if (
      parsed.version !== CONSENT_VERSION ||
      typeof parsed.timestamp !== "string" ||
      typeof parsed.categories?.analytics !== "boolean"
    ) {
      return null;
    }
    return {
      version: parsed.version,
      timestamp: parsed.timestamp,
      categories: { analytics: parsed.categories.analytics },
    };
  } catch {
    return null;
  }
}

export function writeConsent(categories: ConsentCategories): ConsentState {
  const state: ConsentState = {
    version: CONSENT_VERSION,
    timestamp: new Date().toISOString(),
    categories,
  };
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(
    JSON.stringify(state)
  )}; Path=/; Max-Age=${CONSENT_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
  return state;
}

/** Rask synkron sjekk brukt av trackEvent — unngår React-kontekst i lib. */
export function hasAnalyticsConsent(): boolean {
  return readConsent()?.categories.analytics === true;
}
