import type { Availability, SourceSnapshot, StockSource } from "../types";
import { SourceUnavailableError, browserHeaders, retryAfterMs } from "./http";

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
 *
 * ARK har botvern som svarer 429 («Too Many Requests») eller 403 på trafikk
 * som ikke ser ut som en nettleser, og på for hyppige kall. Derfor:
 *  - fullt sett nettleser-headere (ikke bare User-Agent),
 *  - ett nytt forsøk etter `Retry-After` (begrenset, så en server action
 *    ikke henger),
 *  - `minIntervalMs`: hentingen hopper over ARK hvis forrige lagerbilde er
 *    ferskere enn dette, så gjentatte «Hent nå» ikke hamrer på dem,
 *  - 429/403 kastes som `SourceUnavailableError` — en midlertidig blokkering,
 *    ikke en parsefeil. Forrige lagerbilde beholdes, og neste kjøring prøver
 *    igjen.
 */

const PRODUCT_URL = (isbn: string) => `https://www.ark.no/produkt/${isbn}`;

/** Lengste pause vi venter på ARK før vi gir opp denne kjøringen. */
const MAX_RETRY_WAIT_MS = 8_000;

interface ProductJsonLd {
  name?: string;
  isbn?: string;
  offers?: { price?: number | string; availability?: string };
}

/** Plukker ut JSON-LD-blokka for selve boka (ikke organisasjon/brødsmuler). */
export function parseJsonLd(html: string): ProductJsonLd | null {
  // Bok-blokka kan stå med «Product» alene eller sammen med «Book», og med
  // eller uten mellomrom etter kolon — ARK har byttet begge deler før.
  const scripts = html.match(
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g
  );
  for (const script of scripts ?? []) {
    const body = script
      .replace(/^<script[^>]*>/, "")
      .replace(/<\/script>$/, "");
    try {
      const parsed = JSON.parse(body) as unknown;
      const found = findProduct(parsed);
      if (found) return found;
    } catch {
      // Ikke gyldig JSON — hopp videre til neste blokk.
    }
  }
  return null;
}

function findProduct(value: unknown): ProductJsonLd | null {
  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = findProduct(entry);
      if (found) return found;
    }
    return null;
  }
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const type = record["@type"];
  const types = Array.isArray(type) ? type : [type];
  if (types.includes("Product") || types.includes("Book")) {
    return record as ProductJsonLd;
  }
  if (Array.isArray(record["@graph"])) return findProduct(record["@graph"]);
  return null;
}

/**
 * ARKs egen tilstand ligger i Next.js-nyttelasten med escapede hermetegn
 * (\"online\":{\"state\":\"preorder\"}). Vi regexer den ut framfor å parse hele
 * flight-payloaden — den er ustabil mellom deployer, tilstandsfeltene er ikke.
 */
export function parseArkState(html: string): {
  online: string | null;
  store: string | null;
  releaseDate: string | null;
} {
  const online =
    html.match(/\\"online\\":\{\\"state\\":\\"([a-z_]+)\\"/)?.[1] ??
    html.match(/"online":\{"state":"([a-z_]+)"/)?.[1] ??
    null;
  const store =
    html.match(/\\"store\\":\{\\"state\\":\\"([a-z_]+)\\"/)?.[1] ??
    html.match(/"store":\{"state":"([a-z_]+)"/)?.[1] ??
    null;
  const releaseDate =
    html.match(/\\"releaseDate\\":\\"(\d{4}-\d{2}-\d{2})/)?.[1] ??
    html.match(/"releaseDate":"(\d{4}-\d{2}-\d{2})/)?.[1] ??
    null;
  return { online, store, releaseDate };
}

export function toAvailability(
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

function toPrice(value: number | string | undefined): number | null {
  if (value == null) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Henter produktsida. 429/403 prøves én gang til etter `Retry-After` (eller
 * en kort pause) — er svaret fortsatt 429/403, er vi blokkert for denne
 * kjøringen og sier det tydelig.
 */
async function fetchProductPage(isbn: string): Promise<Response> {
  let response = await fetch(PRODUCT_URL(isbn), {
    headers: browserHeaders(),
    redirect: "follow",
    signal: AbortSignal.timeout(20_000),
  });

  if (response.status === 429 || response.status === 403) {
    const wait = Math.min(
      retryAfterMs(response.headers.get("retry-after")) ?? 3_000,
      MAX_RETRY_WAIT_MS
    );
    await sleep(wait);
    response = await fetch(PRODUCT_URL(isbn), {
      headers: browserHeaders(),
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
    });
  }

  if (response.status === 429) {
    throw new SourceUnavailableError(
      "ARK avviser oss midlertidig (429 – for mange forespørsler). Forrige lagerbilde beholdes, og vi prøver igjen ved neste henting."
    );
  }
  if (response.status === 403) {
    throw new SourceUnavailableError(
      "ARK blokkerer automatisk henting akkurat nå (403). Forrige lagerbilde beholdes, og vi prøver igjen ved neste henting."
    );
  }
  return response;
}

export const arkSource: StockSource = {
  key: "ark",
  label: "ARK",
  // ARK har botvern — hent aldri oftere enn dette, uansett hvor mange ganger
  // noen trykker «Hent nå». Lagertallene deres endrer seg uansett ikke
  // oftere.
  minIntervalMs: 30 * 60 * 1000,

  async fetchSnapshot(isbn: string): Promise<SourceSnapshot> {
    const fetchedAt = new Date().toISOString();

    const response = await fetchProductPage(isbn);

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

    // Verken JSON-LD eller tilstandsfeltene funnet: ARK har lagt om sida,
    // eller vi fikk en «er du et menneske?»-side med status 200. Kast heller
    // enn å lagre et falskt «ukjent» snapshot som ser ut som data.
    if (!jsonLd && !state.online) {
      const looksLikeChallenge =
        /captcha|challenge|access denied|bot/i.test(html.slice(0, 5000)) &&
        html.length < 50_000;
      throw new (looksLikeChallenge ? SourceUnavailableError : Error)(
        looksLikeChallenge
          ? "ARK viste en botsjekk i stedet for produktsida. Forrige lagerbilde beholdes, og vi prøver igjen ved neste henting."
          : "Fant verken JSON-LD eller tilstand på ARK-sida — sjekk parseren"
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
      price: toPrice(jsonLd?.offers?.price),
      // ARK oppgir ikke antall per butikk — se filkommentaren.
      stores: [],
      storesWithStock: 0,
      totalCopies: 0,
      note: notes.length > 0 ? notes.join(" · ") : undefined,
    };
  },
};
