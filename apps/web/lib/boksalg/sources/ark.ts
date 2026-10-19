import type { Availability, SourceSnapshot, StockSource } from "../types";
import { SourceUnavailableError, browserHeaders, retryAfterMs } from "./http";

/**
 * ARK. Ingen åpent API, men produktsiden bærer to maskinlesbare kilder:
 *
 *  1. JSON-LD (`@type: ["Product","Book"]`) med pris og schema.org-tilgjengelighet.
 *  2. Next.js-nyttelasten, som inneholder ARKs egen tilstand:
 *     `availability.online.state`, `availability.store.state` og — etter
 *     lansering — `availability.store.count`: hvor mange butikker som har boka.
 *
 * Vi leser begge og lar JSON-LD vinne på pris, ARK-tilstanden på status —
 * JSON-LD skiller ikke «i salg» fra «utsolgt i butikk, kan bestilles».
 *
 * ARK oppgir IKKE antall eksemplarer per butikk slik Norli gjør, bare hvor
 * mange butikker som fører boka (`store.count`, 147 ved lansering). Det tallet
 * lagres som `storesWithStock`/`storeCount`; `totalCopies` og butikklista
 * forblir tomme, og dashbordet sier det rett ut.
 *
 * **Transport.** ARKs WAF avviser Vercels IP-område med 429 på millisekunder —
 * ikke en ratebegrensning, men en blokk som verken nettleser-headere eller
 * `Retry-After` hjelper mot. Derfor hentes sida via Firecrawl når
 * `FIRECRAWL_API_KEY` er satt (én kreditt per henting, ~3 s), og direkte bare
 * når nøkkelen mangler (lokal utvikling). Begge veier ender i samme parser.
 *
 * Mot botvern ellers:
 *  - fullt sett nettleser-headere på direktehenting (ikke bare User-Agent),
 *  - ett nytt forsøk etter `Retry-After` (begrenset, så en server action
 *    ikke henger),
 *  - `minIntervalMs`: hentingen hopper over ARK hvis forrige lagerbilde er
 *    ferskere enn dette, så gjentatte «Hent nå» ikke hamrer på dem,
 *  - 429/403 kastes som `SourceUnavailableError` — en midlertidig blokkering,
 *    ikke en parsefeil. Forrige lagerbilde beholdes, og neste kjøring prøver
 *    igjen.
 */

const PRODUCT_URL = (isbn: string) => `https://www.ark.no/produkt/${isbn}`;

const FIRECRAWL_URL = "https://api.firecrawl.dev/v2/scrape";

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

export interface ArkState {
  online: string | null;
  store: string | null;
  /** Antall butikker som fører boka, når ARK oppgir det. */
  storeCount: number | null;
  releaseDate: string | null;
}

/**
 * ARKs egen tilstand ligger i Next.js-nyttelasten med escapede hermetegn
 * (\"online\":{\"state\":\"inStock\"}). Vi regexer den ut framfor å parse hele
 * flight-payloaden — den er ustabil mellom deployer, tilstandsfeltene er ikke.
 *
 * Verdiene har byttet skrivemåte før (`available` → `inStock`, `orderable`),
 * så regexen tar både små og store bokstaver. Sida har også anbefalte bøker
 * med samme felt; vår bok står først i nyttelasten, så første treff gjelder.
 */
export function parseArkState(html: string): ArkState {
  const first = (patterns: RegExp[]): string | null => {
    for (const pattern of patterns) {
      const hit = html.match(pattern)?.[1];
      if (hit) return hit;
    }
    return null;
  };

  const online = first([
    /\\"online\\":\{\\"state\\":\\"([A-Za-z_]+)\\"/,
    /"online":\{"state":"([A-Za-z_]+)"/,
  ]);
  const storeBlock = first([/\\"store\\":\{([^}]*)\}/, /"store":\{([^}]*)\}/]);
  const store = storeBlock
    ? (storeBlock.match(/state\\?":\\?"([A-Za-z_]+)/)?.[1] ?? null)
    : null;
  const count = storeBlock
    ? (storeBlock.match(/count\\?":(\d+)/)?.[1] ?? null)
    : null;
  const releaseDate = first([
    /\\"releaseDate\\":\\"(\d{4}-\d{2}-\d{2})/,
    /"releaseDate":"(\d{4}-\d{2}-\d{2})/,
  ]);

  return {
    online,
    store,
    storeCount: count === null ? null : Number(count),
    releaseDate,
  };
}

export function toAvailability(
  arkState: string | null,
  schemaAvailability: string | undefined
): Availability {
  switch (arkState?.toLowerCase()) {
    case "preorder":
      return "preorder";
    case "available":
    case "instock":
    case "in_stock":
    case "orderable":
      return "in_stock";
    case "unavailable":
    case "outofstock":
    case "out_of_stock":
    case "soldout":
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

/** Det parseren trenger fra en henting, uansett hvilken vei den gikk. */
interface ProductPage {
  status: number;
  html: string;
}

function throwIfBlocked(status: number, via: string): void {
  if (status === 429) {
    throw new SourceUnavailableError(
      `ARK avviser oss midlertidig (429 – for mange forespørsler${via}). Forrige lagerbilde beholdes, og vi prøver igjen ved neste henting.`
    );
  }
  if (status === 403) {
    throw new SourceUnavailableError(
      `ARK blokkerer automatisk henting akkurat nå (403${via}). Forrige lagerbilde beholdes, og vi prøver igjen ved neste henting.`
    );
  }
}

/**
 * Henter produktsida via Firecrawl, som henter fra sine egne adresser i stedet
 * for Vercels. Vi ber om rå HTML (ikke markdown) så JSON-LD og Next-nyttelasten
 * overlever, og leser ARKs egentlige statuskode fra metadataene.
 */
async function fetchViaFirecrawl(
  isbn: string,
  apiKey: string
): Promise<ProductPage> {
  const response = await fetch(FIRECRAWL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: PRODUCT_URL(isbn),
      formats: ["rawHtml"],
      onlyMainContent: false,
    }),
    signal: AbortSignal.timeout(60_000),
  });

  // Firecrawls egne grenser (kvote, samtidighet) er midlertidige — ikke noe
  // å fikse i koden. Alt annet fra dem er en ekte feil vi vil se.
  if (response.status === 402 || response.status === 429) {
    throw new SourceUnavailableError(
      `Firecrawl avviste hentingen (${response.status} – kvote eller for mange samtidige kall). Forrige lagerbilde beholdes, og vi prøver igjen ved neste henting.`
    );
  }
  if (!response.ok) {
    throw new Error(`Firecrawl svarte ${response.status} for ARK-sida`);
  }

  const body = (await response.json()) as {
    success?: boolean;
    error?: string;
    data?: { rawHtml?: string; metadata?: { statusCode?: number } };
  };
  if (!body.success) {
    throw new Error(
      `Firecrawl klarte ikke hente ARK-sida: ${body.error ?? "ukjent feil"}`
    );
  }
  return {
    status: body.data?.metadata?.statusCode ?? 200,
    html: body.data?.rawHtml ?? "",
  };
}

/**
 * Henter produktsida direkte. 429/403 prøves én gang til etter `Retry-After`
 * (eller en kort pause) — er svaret fortsatt 429/403, er vi blokkert for denne
 * kjøringen. Brukes bare uten Firecrawl-nøkkel; fra Vercel blir dette 429.
 */
async function fetchDirect(isbn: string): Promise<ProductPage> {
  const get = () =>
    fetch(PRODUCT_URL(isbn), {
      headers: browserHeaders(),
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
    });

  let response = await get();
  if (response.status === 429 || response.status === 403) {
    const wait = Math.min(
      retryAfterMs(response.headers.get("retry-after")) ?? 3_000,
      MAX_RETRY_WAIT_MS
    );
    await sleep(wait);
    response = await get();
  }

  return {
    status: response.status,
    html: response.ok ? await response.text() : "",
  };
}

async function fetchProductPage(isbn: string): Promise<ProductPage> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (apiKey) {
    const page = await fetchViaFirecrawl(isbn, apiKey);
    throwIfBlocked(page.status, ", via Firecrawl");
    return page;
  }
  const page = await fetchDirect(isbn);
  throwIfBlocked(page.status, "");
  return page;
}

export const arkSource: StockSource = {
  key: "ark",
  label: "ARK",
  // ARK har botvern — hent aldri oftere enn dette, uansett hvor mange ganger
  // noen trykker «Hent nå». Lagertallene deres endrer seg uansett ikke
  // oftere, og hver henting via Firecrawl koster en kreditt.
  minIntervalMs: 30 * 60 * 1000,

  async fetchSnapshot(isbn: string): Promise<SourceSnapshot> {
    const fetchedAt = new Date().toISOString();

    const page = await fetchProductPage(isbn);

    if (page.status === 404) {
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
    if (page.status < 200 || page.status >= 300) {
      throw new Error(`ARK svarte ${page.status}`);
    }

    const html = page.html;
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

    const storeCount = state.storeCount ?? 0;

    const notes: string[] = [];
    // Utgivelsesdatoen er bare interessant så lenge den ligger foran oss.
    if (state.releaseDate && state.releaseDate > fetchedAt.slice(0, 10)) {
      notes.push(`Utgivelse ${state.releaseDate}`);
    }
    if (storeCount > 0) {
      notes.push(
        `Finnes i ${storeCount} butikker — ARK oppgir ikke antall per butikk`
      );
    } else if (state.store) {
      notes.push(`Butikk: ${state.store}`);
    }

    return {
      sourceKey: "ark",
      fetchedAt,
      online: toAvailability(state.online, jsonLd?.offers?.availability),
      externalId: jsonLd?.isbn ?? isbn,
      price: toPrice(jsonLd?.offers?.price),
      // ARK oppgir ikke antall per butikk — se filkommentaren. Butikkantallet
      // er det eneste tallet, så det er «butikker med boka».
      stores: [],
      storeCount,
      storesWithStock: storeCount,
      totalCopies: 0,
      note: notes.length > 0 ? notes.join(" · ") : undefined,
    };
  },
};
