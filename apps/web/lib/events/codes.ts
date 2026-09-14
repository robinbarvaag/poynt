/**
 * Billettkoder og -nøkler for event-påmeldinger. Ren logikk (ingen server-
 * importer), så den kan testes og brukes både i API-rutene og skanneren.
 *
 * - `code`  («POY-7K3M») er kort og lesbar: den står i e-posten, sies høyt i
 *   døra og kan tastes inn for hånd. Ikke hemmelig.
 * - `token` er lang og tilfeldig: den ligger i billettlenken og QR-koden, og er
 *   det eneste som gir tilgang til billettsiden (og avmelding). Hemmelig.
 */

/** Uten 0/O og 1/I, som er lette å forveksle på skjerm og papir. */
export const TICKET_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const TICKET_CODE_PREFIX = "POY";
const CODE_LENGTH = 4;

function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/** Ny billettkode, f.eks. «POY-7K3M». Kollisjoner håndteres av kalleren. */
export function generateTicketCode(bytes = randomBytes(CODE_LENGTH)): string {
  const chars = Array.from(
    bytes.slice(0, CODE_LENGTH),
    (b) => TICKET_CODE_ALPHABET[b % TICKET_CODE_ALPHABET.length]
  ).join("");
  return `${TICKET_CODE_PREFIX}-${chars}`;
}

/**
 * Normaliserer en kode tastet inn for hånd: «poy 7k3m», «7K3M» og «POY-7K3M»
 * blir alle «POY-7K3M». Returnerer null når det ikke kan være en gyldig kode.
 */
export function normalizeTicketCode(input: string): string | null {
  let compact = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (compact.startsWith(TICKET_CODE_PREFIX)) {
    compact = compact.slice(TICKET_CODE_PREFIX.length);
  }
  if (compact.length !== CODE_LENGTH) return null;
  for (const char of compact) {
    if (!TICKET_CODE_ALPHABET.includes(char)) return null;
  }
  return `${TICKET_CODE_PREFIX}-${compact}`;
}

/** Hemmelig nøkkel til billettlenken: 32 tilfeldige bytes, base64url. */
export function generateTicketToken(bytes = randomBytes(32)): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,64}$/;

export function isTicketToken(value: string): boolean {
  return TOKEN_PATTERN.test(value);
}

/** Stien til billettsiden. QR-koden peker hit. */
export function ticketPath(token: string): string {
  return `/eventer/billett/${token}`;
}

/**
 * Hva skanneren fikk: enten hele billettlenken (fra QR-koden) eller en rå
 * nøkkel. Returnerer nøkkelen, eller null hvis det ikke er en Poynt-billett.
 */
export function extractTicketToken(scanned: string): string | null {
  const value = scanned.trim();
  const match = /\/eventer\/billett\/([A-Za-z0-9_-]+)/.exec(value);
  const candidate = match ? match[1] : value;
  return isTicketToken(candidate) ? candidate : null;
}
