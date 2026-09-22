import type {
  Availability,
  SourceSnapshot,
  StockSource,
  StoreStock,
} from "../types";

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
 */

const ENDPOINT = "https://www.norli.no/graphql";

// Norli svarer med tom liste på ukjent User-Agent i perioder; vi oppfører oss
// som en vanlig nettleser og spør sjelden (én gang i døgnet).
const HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
};

// Dollartegnene er GraphQL-variabler, ikke JS-interpolasjon — derfor vanlige
// strenger og ikke template-literaler.
const PRODUCT_QUERY =
  "query P($sku:String!){products(filter:{sku:{eq:$sku}}){items{id sku name stock_status price_range{minimum_price{final_price{value}}}}}}";

const SEARCH_QUERY =
  "query S($q:String!){products(search:$q,pageSize:5){items{id sku name}}}";

const PICKUP_QUERY =
  "query pickupStores($productIds:[Int]$storeIds:[Int]=[]){pickupStores(productIds:$productIds storeIds:$storeIds){name stores{address city email latitude longitude name phone postcode region schedule stockist_id products{id qty_in_store}}}}";

interface NorliProduct {
  id: number;
  sku: string;
  name: string;
  stock_status?: string;
  price_range?: { minimum_price?: { final_price?: { value?: number } } };
}

interface NorliStore {
  address?: string | null;
  city?: string | null;
  email?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  name: string;
  phone?: string | null;
  postcode?: string | null;
  region?: string | null;
  schedule?: string | null;
  stockist_id: number;
  products: { id: number; qty_in_store: number }[];
}

interface NorliRegion {
  name: string;
  stores: NorliStore[];
}

async function graphql<T>(query: string, variables: unknown): Promise<T> {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(20_000),
  });
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

function toNumber(value: string | null | undefined): number | undefined {
  if (value == null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
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

function toStoreStock(
  store: NorliStore,
  regionName: string,
  productId: number | null
): StoreStock {
  const qty = productId
    ? (store.products.find((p) => p.id === productId)?.qty_in_store ?? 0)
    : 0;
  return {
    storeId: String(store.stockist_id),
    // Norli setter «Norli » foran alle navn; det er støy i en liste som bare
    // inneholder Norli-butikker.
    name: store.name.replace(/^Norli\s+/i, ""),
    city: store.city ?? undefined,
    // Regionen på butikken er ofte tom; fall tilbake på gruppenavnet (fylket).
    region: store.region || regionName,
    qty,
    address: cleanText(store.address),
    postcode: cleanText(store.postcode),
    email: cleanText(store.email),
    phone: cleanText(store.phone),
    schedule: cleanSchedule(store.schedule),
    latitude: toNumber(store.latitude),
    longitude: toNumber(store.longitude),
  };
}

async function fetchStores(productId: number): Promise<StoreStock[]> {
  const data = await graphql<{ pickupStores: NorliRegion[] }>(PICKUP_QUERY, {
    storeIds: [],
    productIds: [productId],
  });
  const stores: StoreStock[] = [];
  for (const region of data.pickupStores ?? []) {
    for (const store of region.stores ?? []) {
      stores.push(toStoreStock(store, region.name, productId));
    }
  }
  return stores;
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
    const product = productData.products.items[0];

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
    const withStock = stores.filter((s) => s.qty > 0);

    return {
      sourceKey: "norli",
      fetchedAt,
      online: toAvailability(product.stock_status),
      externalId: String(product.id),
      price: product.price_range?.minimum_price?.final_price?.value ?? null,
      stores,
      storesWithStock: withStock.length,
      totalCopies: withStock.reduce((sum, s) => sum + s.qty, 0),
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
    for (const candidate of search.products.items) {
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
