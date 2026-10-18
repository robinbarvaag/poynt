/**
 * Felles HTTP-småting for kildeadapterne.
 *
 * Bokhandlerne har botvern. Det som skiller oss fra en nettleser er ikke
 * User-Agent alene, men at resten av headerne mangler — derfor sender vi det
 * samme settet Chrome sender på en vanlig sidevisning.
 */

/** Chrome på Windows, høsten 2026. Oppdater ved behov; ARK ser på den. */
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

export function browserHeaders(
  kind: "document" | "json" = "document"
): Record<string, string> {
  const common = {
    "User-Agent": USER_AGENT,
    "Accept-Language": "nb-NO,nb;q=0.9,no;q=0.8,en-US;q=0.7,en;q=0.6",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  };
  if (kind === "json") {
    return {
      ...common,
      Accept: "application/json",
      "Content-Type": "application/json",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
    };
  }
  return {
    ...common,
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
  };
}

/**
 * `Retry-After` kan være sekunder («120») eller en HTTP-dato. Gir millisekunder
 * å vente, eller null når headeren mangler eller er uleselig.
 */
export function retryAfterMs(header: string | null): number | null {
  if (!header) return null;
  const trimmed = header.trim();
  if (/^\d+$/.test(trimmed)) return Number(trimmed) * 1000;
  const at = Date.parse(trimmed);
  if (Number.isNaN(at)) return null;
  return Math.max(0, at - Date.now());
}

/**
 * Kilden svarte, men vil ikke snakke med oss akkurat nå (429, 403, botsjekk).
 * Skilles fra parse- og nettverksfeil fordi det ikke er noe å «fikse» i koden:
 * forrige lagerbilde beholdes og neste kjøring prøver igjen.
 */
export class SourceUnavailableError extends Error {
  readonly transient = true;

  constructor(message: string) {
    super(message);
    this.name = "SourceUnavailableError";
  }
}

export function isTransientSourceError(error: unknown): boolean {
  return (
    error instanceof SourceUnavailableError ||
    (typeof error === "object" &&
      error !== null &&
      (error as { transient?: boolean }).transient === true)
  );
}
