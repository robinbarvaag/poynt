import type {
  Availability,
  SourceSnapshot,
  StockSource,
  StoreStock,
} from "../types";
import { SourceUnavailableError, browserHeaders } from "./http";

/**
 * Norli. Magento-basert, med et åpent GraphQL-endepunkt som nettbutikken selv
 * bruker. `pickupStores` er gullet: den gir antall eksemplarer per fysisk
 * butikk (197 butikker) — pluss e-post, telefon, adresse, åpningstider og
 * koordinater for hver av dem. Det er det eneste stedet vi kan lese noe som
 * ligner på salg uten avregning fra distributøren, og det er kontaktlista
 * Susanne trenger for å ringe butikker som ikke har tatt inn boka.
 *
 * Vi slår opp produkt-ID fra ISBN i stedet for å hardkode den — Magento-IDer
 * er ikke garantert stabile, og pocket/ny utgave får uansett sin egen ISBN.
 *
 * Tallene fra Norli skal ikke stoles blindt på. Tre ting har vist seg å
 * kunne gå galt, og alle tre ville talt feil uten å feile:
 *  - `id` i `pickupStores.products` og `id` fra produktoppslaget er ikke
 *    nødvendigvis samme type (Int vs String). Sammenlignes de med `===`,
 *    matcher ingen butikk og alt teller 0. Vi sammenligner som strenger.
 *  - `qty_in_store` kan komme som streng, desimaltall, null — eller negativt
 *    (Magento tillater negativ beholdning ved restordre). En negativ verdi
 *    ville blitt lest som «salg» i diff-en. Alt normaliseres til et heltall
 *    ≥ 0 i `normalizeQty`.
 *  - Samme butikk kan stå i flere regiongrupper. Uten dedupe telles den
 *    dobbelt i totalen, får doble salgshendelser, og lagres som to rader.
 */

const ENDPOINT = "https://www.norli.no/graphql";

// Dollartegnene er GraphQL-variabler, ikke JS-interpolasjon — derfor vanlige
// strenger og ikke template-literaler.
const PRODUCT_QUERY =
  "query P($sku:String!){products(filter:{sku:{eq:$sku}}){items{id sku name stock_status price_range{minimum_price{final_price{value}}}}}}";

const SEARCH_QUERY =
  "query S($q:String!){products(search:$q,pageSize:5){items{id sku name}}}";

const PICKUP_QUERY =
  "query pickupStores($productIds:[Int]$storeIds:[Int]=[]){pickupStores(productIds:$productIds storeIds:$storeIds){name stores{address city email latitude longitude name phone postcode region schedule stockist_id products{id qty_in_store}}}}";

interface NorliProduct {
  id: number | string;
  sku: string;
  name: string;
  stock_status?: string;
  price_range?: { minimum_price?: { final_price?: { value?: number } } };
}

export interface NorliStore {
  address?: string | null;
  city?: string | null;
  email?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  name: string;
  phone?: string | null;
  postcode?: string | null;
  region?: string | null;
  schedule?: string | null;
  stockist_id: number | string;
  products?:
    | { id: number | string; qty_in_store: number | string | null }[]
    | null;
}

export interface NorliRegion {
  name: string;
  stores?: NorliStore[] | null;
}

async function graphql<T>(query: string, variables: unknown): Promise<T> {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: browserHeaders("json"),
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(20_000),
  });
  if (response.status === 429 || response.status === 403) {
    throw new SourceUnavailableError(
      `Norli avviser oss midlertidig (${response.status}). Forrige lagerbilde beholdes, og vi prøver igjen ved neste henting.`
    );
  }
  if (!response.ok) {
    throw new Error(`Norli svarte ${response.status}`);
  }
  const body = (await response.json()) as { data?: T; errors?: unknown[] };
  if (body.errors?.length) {
    throw new Error(
      `Norli GraphQL-feil: ${JSON.stringify(body.errors).slice(0, 200)}`
    );
  }
  if (!body.data) throw new Error("Norli svarte uten data");
  return body.data;
}

function toAvailability(stockStatus: string | undefined): Availability {
  if (stockStatus === "IN_STOCK") return "in_stock";
  if (stockStatus === "OUT_OF_STOCK") return "out_of_stock";
  return "unknown";
}

function toNumber(
  value: string | number | null | undefined
): number | undefined {
  if (value == null || value === "") return undefined;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * Beholdning slik vi teller den: et heltall som aldri er negativt. Null,
 * tomme strenger og tull blir 0 — «vet ikke» og «ingen» er det samme for en
 * hylle. Negative tall (restordre) er heller ikke bøker på hylla.
 */
export function normalizeQty(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.floor(parsed));
}

/** Norli skriver «\r\n» mellom åpningstidslinjene; vi normaliserer til «\n». */
function cleanSchedule(value: string | null | undefined): string | undefined {
  const cleaned = value?.replace(/\r\n?/g, "\n").trim();
  return cleaned || undefined;
}

/** Minst én adresse hos Norli har et ledende mellomrom (« akademisk.uib@…»). */
function cleanText(value: string | null | undefined): string | undefined {
  const cleaned = value?.trim();
  return cleaned || undefined;
}

/** Produkt-ID-er sammenlignes som strenger — Int og String skal matche. */
function sameId(a: number | string, b: number | string): boolean {
  return String(a).trim() === String(b).trim();
}

export function toStoreStock(
  store: NorliStore,
  regionName: string,
  productId: number | string | null
): StoreStock {
  const match =
    productId === null
      ? undefined
      : (store.products ?? []).find((p) => sameId(p.id, productId));
  return {
    storeId: String(store.stockist_id),
    // Norli setter «Norli » foran alle navn; det er støy i en liste som bare
    // inneholder Norli-butikker.
    name: store.name.replace(/^Norli\s+/i, "").trim(),
    city: cleanText(store.city),
    // Regionen på butikken er ofte tom; fall tilbake på gruppenavnet (fylket).
    region: cleanText(store.region) || cleanText(regionName),
    qty: normalizeQty(match?.qty_in_store),
    address: cleanText(store.address),
    postcode: cleanText(store.postcode),
    email: cleanText(store.email),
    phone: cleanText(store.phone),
    schedule: cleanSchedule(store.schedule),
    latitude: toNumber(store.latitude),
    longitude: toNumber(store.longitude),
  };
}

/**
 * Flater regiongruppene ut til én liste med én rad per butikk. Står en
 * butikk i to grupper, beholdes den første — men med høyeste beholdning, så
 * en gruppe med «0» ikke nuller ut en med tall.
 */
export function parsePickupStores(
  regions: NorliRegion[] | null | undefined,
  productId: number | string | null
): StoreStock[] {
  const byId = new Map<string, StoreStock>();
  for (const region of regions ?? []) {
    for (const store of region.stores ?? []) {
      if (store?.stockist_id == null || !store.name) continue;
      const row = toStoreStock(store, region.name, productId);
      const existing = byId.get(row.storeId);
      if (existing) {
        existing.qty = Math.max(existing.qty, row.qty);
        continue;
      }
      byId.set(row.storeId, row);
    }
  }
  return [...byId.values()];
}

/** Summene snapshot-raden lagrer, regnet fra butikklista. */
export function summarizeStores(stores: StoreStock[]): {
  storesWithStock: number;
  totalCopies: number;
} {
  let storesWithStock = 0;
  let totalCopies = 0;
  for (const store of stores) {
    if (store.qty > 0) {
      storesWithStock += 1;
      totalCopies += store.qty;
    }
  }
  return { storesWithStock, totalCopies };
}

async function fetchStores(productId: number | string): Promise<StoreStock[]> {
  const numericId = Number(productId);
  const data = await graphql<{ pickupStores: NorliRegion[] | null }>(
    PICKUP_QUERY,
    {
      storeIds: [],
      productIds: [Number.isFinite(numericId) ? numericId : productId],
    }
  );
  return parsePickupStores(data.pickupStores, productId);
}

export const norliSource: StockSource = {
  key: "norli",
  label: "Norli",

  async fetchSnapshot(isbn: string): Promise<SourceSnapshot> {
    const fetchedAt = new Date().toISOString();

    const productData = await graphql<{ products: { items: NorliProduct[] } }>(
      PRODUCT_QUERY,
      { sku: isbn }
    );
    // Filteret er eksakt på SKU, men ta den som faktisk matcher om Norli
    // skulle begynne å svare med flere (pocket, e-bok med egen SKU).
    const items = productData.products?.items ?? [];
    const product = items.find((item) => item.sku === isbn) ?? items[0];

    if (!product) {
      return {
        sourceKey: "norli",
        fetchedAt,
        online: "not_listed",
        externalId: null,
        price: null,
        stores: [],
        storesWithStock: 0,
        totalCopies: 0,
        note: "Boka finnes ikke i Norlis katalog",
      };
    }

    const stores = await fetchStores(product.id);
    const { storesWithStock, totalCopies } = summarizeStores(stores);

    return {
      sourceKey: "norli",
      fetchedAt,
      online: toAvailability(product.stock_status),
      externalId: String(product.id),
      price: product.price_range?.minimum_price?.final_price?.value ?? null,
      stores,
      storesWithStock,
      totalCopies,
      // Tom liste betyr at boka ikke er i Norlis hentesystem ennå — ikke at
      // hentingen feilet. Skriv det ned, så slipper vi å lure på det senere.
      note:
        stores.length === 0
          ? "Ingen fysiske butikker fører boka ennå"
          : undefined,
    };
  },

  /**
   * `pickupStores` krever en gyldig produkt-ID, og for en bok som ikke er i
   * hentesystemet ennå svarer den med tom liste — også for butikkene uten
   * boka. Før lansering må vi derfor låne et annet produkt for å få
   * butikklista. Vi søker på et generisk ord og bruker den første treffet som
   * faktisk gir butikker, i stedet for å hardkode en bestemt bok som kan
   * forsvinne fra katalogen.
   */
  async fetchStoreDirectory(): Promise<StoreStock[]> {
    const search = await graphql<{ products: { items: NorliProduct[] } }>(
      SEARCH_QUERY,
      { q: "kokebok" }
    );
    for (const candidate of search.products?.items ?? []) {
      const stores = await fetchStores(candidate.id);
      if (stores.length > 0) {
        // Beholdningen gjelder lånt produkt, ikke vår bok — nullstill den.
        return stores.map((store) => ({ ...store, qty: 0 }));
      }
    }
    throw new Error(
      "Fant ingen referanseprodukt som gir Norlis butikkliste — sjekk søkeordet"
    );
  },
};
