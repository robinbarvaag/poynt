import type { Availability, SourceSnapshot, StockSource } from "../types";

/**
 * ARK. Ingen åpent API, men produktsiden bærer to maskinlesbare kilder:
 *
 *  1. JSON-LD (`@type: ["Product","Book"]`) med pris og schema.org-tilgjengelighet.
 *  2. Next.js-nyttelasten, som inneholder ARKs egen tilstand:
 *     `availability.online.state` og `availability.store.state`.
 *
 * Vi leser begge og lar JSON-LD vinne på pris, ARK-tilstanden på status —
 * JSON-LD skiller ikke «i salg» fra «utsolgt i butikk, kan bestilles».
 *
 * ARK oppgir IKKE antall per butikk slik Norli gjør. Så lenge `store.state` er
 * «unavailable» finnes det ingen butikkliste å hente. Når boka kommer i butikk
 * skal denne adapteren utvides med butikklageret — inntil da er ARKs bidrag
 * status og pris, ikke tellinger.
 */

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml",
};

interface ProductJsonLd {
  name?: string;
  isbn?: string;
  offers?: { price?: number; availability?: string };
}

/** Plukker ut JSON-LD-blokka for selve boka (ikke organisasjon/brødsmuler). */
function parseJsonLd(html: string): ProductJsonLd | null {
  const match = html.match(
    /\{"@context":"https:\/\/schema\.org","@type":\["Product","Book"\][\s\S]*?\}(?=<\/script>)/
  );
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as ProductJsonLd;
  } catch {
    return null;
  }
}

/**
 * ARKs egen tilstand ligger i Next.js-nyttelasten med escapede hermetegn
 * (\"online\":{\"state\":\"preorder\"}). Vi regexer den ut framfor å parse hele
 * flight-payloaden — den er ustabil mellom deployer, tilstandsfeltene er ikke.
 */
function parseArkState(html: string): {
  online: string | null;
  store: string | null;
  releaseDate: string | null;
} {
  const online =
    html.match(/\\"online\\":\{\\"state\\":\\"([a-z_]+)\\"/)?.[1] ?? null;
  const store =
    html.match(/\\"store\\":\{\\"state\\":\\"([a-z_]+)\\"/)?.[1] ?? null;
  const releaseDate =
    html.match(/\\"releaseDate\\":\\"(\d{4}-\d{2}-\d{2})/)?.[1] ?? null;
  return { online, store, releaseDate };
}

function toAvailability(
  arkState: string | null,
  schemaAvailability: string | undefined
): Availability {
  switch (arkState) {
    case "preorder":
      return "preorder";
    case "available":
    case "in_stock":
      return "in_stock";
    case "unavailable":
    case "out_of_stock":
      return "out_of_stock";
    default:
      break;
  }
  if (schemaAvailability?.includes("PreOrder")) return "preorder";
  if (schemaAvailability?.includes("InStock")) return "in_stock";
  if (schemaAvailability?.includes("OutOfStock")) return "out_of_stock";
  return "unknown";
}

export const arkSource: StockSource = {
  key: "ark",
  label: "ARK",

  async fetchSnapshot(isbn: string): Promise<SourceSnapshot> {
    const fetchedAt = new Date().toISOString();

    const response = await fetch(`https://www.ark.no/produkt/${isbn}`, {
      headers: HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
    });

    if (response.status === 404) {
      return {
        sourceKey: "ark",
        fetchedAt,
        online: "not_listed",
        externalId: null,
        price: null,
        stores: [],
        storesWithStock: 0,
        totalCopies: 0,
        note: "Boka finnes ikke i ARKs katalog",
      };
    }
    if (!response.ok) {
      throw new Error(`ARK svarte ${response.status}`);
    }

    const html = await response.text();
    const jsonLd = parseJsonLd(html);
    const state = parseArkState(html);

    // Verken JSON-LD eller tilstandsfeltene funnet: ARK har lagt om sida.
    // Kast heller enn å lagre et falskt «ukjent» snapshot som ser ut som data.
    if (!jsonLd && !state.online) {
      throw new Error(
        "Fant verken JSON-LD eller tilstand på ARK-sida — sjekk parseren"
      );
    }

    const notes: string[] = [];
    if (state.releaseDate) notes.push(`Utgivelse ${state.releaseDate}`);
    if (state.store) notes.push(`Butikk: ${state.store}`);

    return {
      sourceKey: "ark",
      fetchedAt,
      online: toAvailability(state.online, jsonLd?.offers?.availability),
      externalId: jsonLd?.isbn ?? isbn,
      price: jsonLd?.offers?.price ?? null,
      // ARK oppgir ikke antall per butikk — se filkommentaren.
      stores: [],
      storesWithStock: 0,
      totalCopies: 0,
      note: notes.length > 0 ? notes.join(" · ") : undefined,
    };
  },
};
