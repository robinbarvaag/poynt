/**
 * Brønnøysundregistrene — Enhetsregisteret (åpent API, ingen nøkkel/auth).
 * Slår opp en bedrift på organisasjonsnummer og returnerer de feltene vi kan
 * bruke til å forhåndsfylle bedriftsprofilen: navn, næringskode (→ bransje),
 * antall ansatte (→ bedriftsstørrelse) og hjemmeside (→ merkevare-crawl).
 *
 * Dokumentasjon: https://data.brreg.no/enhetsregisteret/api/docs/index.html
 */

const ENHETSREGISTERET_URL =
  "https://data.brreg.no/enhetsregisteret/api/enheter";

/** Renset, typet utdrag av et Enhetsregister-oppslag — kun feltene vi bruker. */
export interface BrregEnhet {
  orgNumber: string;
  name: string;
  /** Næringskode (NACE), f.eks. "47.110". */
  naceCode: string | null;
  /** Tekstlig beskrivelse av næringskoden, f.eks. "Butikkhandel med …". */
  naceDescription: string | null;
  /** Antall ansatte slik det er registrert (kan være 0 / mangle). */
  employeeCount: number | null;
  /** Normalisert hjemmeside-URL (https://…) hvis registrert. */
  website: string | null;
}

interface EnhetResponse {
  organisasjonsnummer?: string;
  navn?: string;
  naeringskode1?: { kode?: string; beskrivelse?: string };
  antallAnsatte?: number;
  hjemmeside?: string;
  slettedato?: string;
}

/** Fjerner mellomrom og validerer at vi sitter igjen med 9 siffer. */
export function normalizeOrgNumber(input: string): string | null {
  const digits = input.replace(/\s/g, "");
  return /^\d{9}$/.test(digits) ? digits : null;
}

/** Sikrer at en registrert hjemmeside får protokoll, ellers null. */
function normalizeWebsite(raw?: string): string | null {
  const value = raw?.trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

/**
 * Slår opp en bedrift i Enhetsregisteret. Kaster med en klar, bruker-vennlig
 * feilmelding (norsk) hvis nummeret er ugyldig, ikke finnes, eller API-et er
 * utilgjengelig — så UI-et kan vise det og la brukeren fylle inn manuelt.
 */
export async function lookupOrgNumber(orgNumber: string): Promise<BrregEnhet> {
  const normalized = normalizeOrgNumber(orgNumber);
  if (!normalized) {
    throw new Error("Ugyldig organisasjonsnummer — det skal være 9 siffer.");
  }

  let res: Response;
  try {
    res = await fetch(`${ENHETSREGISTERET_URL}/${normalized}`, {
      headers: { Accept: "application/json" },
    });
  } catch {
    throw new Error(
      "Klarte ikke nå Brønnøysundregistrene. Prøv igjen, eller fyll inn manuelt."
    );
  }

  if (res.status === 404) {
    throw new Error(
      "Fant ingen bedrift med dette organisasjonsnummeret i Enhetsregisteret."
    );
  }
  if (!res.ok) {
    throw new Error(
      `Oppslag mot Brønnøysund feilet (svarte ${res.status}). Prøv igjen senere.`
    );
  }

  const data = (await res.json()) as EnhetResponse;

  if (data.slettedato) {
    throw new Error("Denne bedriften er slettet i Enhetsregisteret.");
  }

  return {
    orgNumber: data.organisasjonsnummer ?? normalized,
    name: data.navn?.trim() ?? "",
    naceCode: data.naeringskode1?.kode?.trim() || null,
    naceDescription: data.naeringskode1?.beskrivelse?.trim() || null,
    employeeCount:
      typeof data.antallAnsatte === "number" ? data.antallAnsatte : null,
    website: normalizeWebsite(data.hjemmeside),
  };
}
