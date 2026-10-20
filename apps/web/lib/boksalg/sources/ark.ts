import type {
  Availability,
  SourceSnapshot,
  StockSource,
  StoreStock,
} from "../types";
import { SourceUnavailableError, browserHeaders } from "./http";
import { normalizeQty, summarizeStores } from "./norli";
import { regionFromPostcode } from "./postcode-region";

/**
 * ARK. Nettbutikken er bygd på et åpent «experience»-API som butikkvelgeren
 * («Velg butikk» på produktsida) selv snakker med, og det gir oss det samme
 * som Norlis GraphQL: antall eksemplarer per fysisk butikk, pluss e-post,
 * telefon, adresse, åpningstider og koordinater for alle 155 butikkene.
 *
 *  - `GET  /api/product/sku/<isbn>`      → pris, nettstatus, antall butikker
 *  - `POST /api/store/availabilities`    → alle butikker med
 *    `productAvailability[isbn].availableQuantityInStore`
 *
 * Selve www.ark.no står bak en WAF som avviser Vercels IP-område med 429, men
 * API-et (experience.api.ark.no) gjør det ikke — det svarer til og med på
 * forespørsler uten nettleser-headere. Vi sender dem likevel, for det koster
 * ingenting og skiller oss ikke ut. 429/403 kastes som
 * `SourceUnavailableError`: forrige lagerbilde beholdes, neste kjøring prøver
 * igjen.
 *
 * Tallene normaliseres på samme måte som Norlis (`normalizeQty`): null, tomt
 * og negativt blir 0, så en manglende verdi aldri leses som salg.
 */

const API = "https://experience.api.ark.no/api";

interface ArkProduct {
  sku?: string;
  name?: string;
  pricesNokOre?: { customerPrice?: { price?: number | null } | null } | null;
  variantAvailability?: {
    onlineAvailability?: string | null;
    cncAvailability?: string | null;
    /** Butikker med boka på hylla akkurat nå. */
    cncAvailableInStoresCount?: number | null;
    /** Butikker boka kan bestilles til (Klikk&Hent). */
    orderCncAvailableStoresCount?: number | null;
    marketPublicationDate?: string | null;
  } | null;
}

interface ArkOpeningHours {
  isOpen?: boolean | null;
  openFrom?: string | null;
  openTo?: string | null;
}

export interface ArkStore {
  id: string | number;
  name: string;
  address?: {
    streetName?: string | null;
    streetNumber?: string | null;
    city?: string | null;
    zipcode?: string | null;
    municipality?: string | null;
  } | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  phoneNumber?: string | null;
  email?: string | null;
  mondayOpeningHours?: ArkOpeningHours | null;
  tuesdayOpeningHours?: ArkOpeningHours | null;
  wednesdayOpeningHours?: ArkOpeningHours | null;
  thursdayOpeningHours?: ArkOpeningHours | null;
  fridayOpeningHours?: ArkOpeningHours | null;
  saturdayOpeningHours?: ArkOpeningHours | null;
  sundayOpeningHours?: ArkOpeningHours | null;
  productAvailability?: Record<
    string,
    {
      isCnCAvailable?: boolean | null;
      isCncOrderAvailable?: boolean | null;
      availableQuantityInStore?: number | string | null;
    } | null
  > | null;
}

interface ArkAvailabilities {
  values?: ArkStore[] | null;
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      ...browserHeaders("json"),
      Origin: "https://www.ark.no",
      Referer: "https://www.ark.no/",
      ...init.headers,
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (response.status === 429 || response.status === 403) {
    throw new SourceUnavailableError(
      `ARK avviser oss midlertidig (${response.status}). Forrige lagerbilde beholdes, og vi prøver igjen ved neste henting.`
    );
  }
  if (response.status === 404) {
    throw new NotFoundError(path);
  }
  if (!response.ok) {
    throw new Error(`ARK svarte ${response.status} på ${path}`);
  }
  return (await response.json()) as T;
}

class NotFoundError extends Error {
  constructor(path: string) {
    super(`ARK fant ikke ${path}`);
    this.name = "NotFoundError";
  }
}

/** ARKs status-ord → våre. Store/små bokstaver har byttet før, så vi senker. */
export function toAvailability(state: string | null | undefined): Availability {
  switch (state?.toLowerCase()) {
    case "preorder":
    case "pre_order":
      return "preorder";
    case "available":
    case "instock":
    case "in_stock":
      return "in_stock";
    case "unavailable":
    case "soldout":
    case "sold_out":
    case "outofstock":
    case "out_of_stock":
      return "out_of_stock";
    default:
      return "unknown";
  }
}

/** Pris i øre → kroner. Null og tull blir null, ikke 0 — 0 kr er ikke en pris. */
export function toPrice(ore: number | null | undefined): number | null {
  if (ore == null || !Number.isFinite(ore) || ore <= 0) return null;
  return Math.round(ore) / 100;
}

function toNumber(
  value: string | number | null | undefined
): number | undefined {
  if (value == null || value === "") return undefined;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function cleanText(value: string | null | undefined): string | undefined {
  const cleaned = value?.trim();
  return cleaned || undefined;
}

const DAYS: [keyof ArkStore, string][] = [
  ["mondayOpeningHours", "Mandag"],
  ["tuesdayOpeningHours", "Tirsdag"],
  ["wednesdayOpeningHours", "Onsdag"],
  ["thursdayOpeningHours", "Torsdag"],
  ["fridayOpeningHours", "Fredag"],
  ["saturdayOpeningHours", "Lørdag"],
  ["sundayOpeningHours", "Søndag"],
];

/** «10:00:00» → «10:00». */
const clock = (value: string | null | undefined) =>
  (value ?? "").slice(0, 5) || null;

/**
 * Åpningstider som én linje per dag, samme format som Norlis fritekst. Dager
 * uten data hoppes over; en butikk uten noen dager får ingen tekst.
 */
export function toSchedule(store: ArkStore): string | undefined {
  const lines: string[] = [];
  for (const [key, label] of DAYS) {
    const hours = store[key] as ArkOpeningHours | null | undefined;
    if (!hours) continue;
    if (hours.isOpen === false) {
      lines.push(`${label} stengt`);
      continue;
    }
    const from = clock(hours.openFrom);
    const to = clock(hours.openTo);
    if (from && to) lines.push(`${label} ${from}–${to}`);
  }
  return lines.length > 0 ? lines.join("\n") : undefined;
}

export function toStoreStock(store: ArkStore, isbn: string): StoreStock {
  const address = store.address ?? {};
  const street = [
    cleanText(address.streetName),
    cleanText(address.streetNumber),
  ]
    .filter(Boolean)
    .join(" ");
  const postcode = cleanText(address.zipcode);
  return {
    storeId: String(store.id),
    // ARK setter «ARK » foran alle navn; det er støy i en liste som bare
    // inneholder ARK-butikker.
    name: store.name.replace(/^ARK\s+/i, "").trim(),
    city: cleanText(address.city),
    // ARK oppgir kommune, ikke fylke — fylket utledes av postnummeret, så
    // butikkene kan stå i samme fylkestabell som Norlis.
    region: regionFromPostcode(postcode) ?? cleanText(address.municipality),
    qty: normalizeQty(
      store.productAvailability?.[isbn]?.availableQuantityInStore
    ),
    address: street || undefined,
    postcode,
    email: cleanText(store.email),
    phone: cleanText(store.phoneNumber),
    schedule: toSchedule(store),
    latitude: toNumber(store.latitude),
    longitude: toNumber(store.longitude),
  };
}

/** Én rad per butikk; samme ID to ganger beholder høyeste beholdning. */
export function parseStores(
  values: ArkStore[] | null | undefined,
  isbn: string
): StoreStock[] {
  const byId = new Map<string, StoreStock>();
  for (const store of values ?? []) {
    if (store?.id == null || !store.name) continue;
    const row = toStoreStock(store, isbn);
    const existing = byId.get(row.storeId);
    if (existing) {
      existing.qty = Math.max(existing.qty, row.qty);
      continue;
    }
    byId.set(row.storeId, row);
  }
  return [...byId.values()];
}

export const arkSource: StockSource = {
  key: "ark",
  label: "ARK",

  async fetchSnapshot(isbn: string): Promise<SourceSnapshot> {
    const fetchedAt = new Date().toISOString();

    let product: ArkProduct;
    try {
      product = await api<ArkProduct>(
        `/product/sku/${encodeURIComponent(isbn)}`
      );
    } catch (error) {
      if (error instanceof NotFoundError) {
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
      throw error;
    }

    const availabilities = await api<ArkAvailabilities>(
      "/store/availabilities",
      { method: "POST", body: JSON.stringify({ skus: [isbn] }) }
    );
    const stores = parseStores(availabilities.values, isbn);
    const { storesWithStock, totalCopies } = summarizeStores(stores);

    // Tom butikkliste fra et API som ellers alltid gir alle 155: da har ARK
    // lagt om, og vi vil heller feile enn å lagre «alle butikker tømt».
    if (stores.length === 0) {
      throw new Error(
        "ARK ga ingen butikker for boka — sjekk /store/availabilities-parseren"
      );
    }

    const variant = product.variantAvailability ?? {};
    const orderable = variant.orderCncAvailableStoresCount ?? 0;
    const notes: string[] = [];
    if (orderable > storesWithStock) {
      notes.push(`Kan bestilles til ${orderable} butikker`);
    }

    return {
      sourceKey: "ark",
      fetchedAt,
      online: toAvailability(variant.onlineAvailability),
      externalId: product.sku ?? isbn,
      price: toPrice(product.pricesNokOre?.customerPrice?.price),
      stores,
      storesWithStock,
      totalCopies,
      note: notes.length > 0 ? notes.join(" · ") : undefined,
    };
  },
};
