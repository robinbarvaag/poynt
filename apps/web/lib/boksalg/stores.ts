import type { BookStore } from "@/payload-types";
import type { Payload } from "payload";
import type { StockEvent, StoreStock } from "./types";

/**
 * Holder «Butikker»-samlingen i takt med det vi henter fra kjedene.
 *
 * Ett prinsipp styrer alt her: kjedefeltene (navn, kontaktinfo, lagertall)
 * skrives av oss og overskrives ved hver henting — oppfølgingsfeltene
 * (followUpStatus, followUpAt, notes) er Susannes og sendes ALDRI med i en
 * oppdatering. Payloads lokale API gjør delvise oppdateringer, så felt vi
 * utelater står urørt.
 */

type SourceKey = BookStore["sourceKey"];

/** Det hentingen får sette på en butikkrad. Oppfølgingsfeltene finnes ikke her. */
export interface StoreRowUpdate {
  sourceKey: SourceKey;
  storeId: string;
  name: string;
  city: string | null;
  region: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  postcode: string | null;
  schedule: string | null;
  latitude: number | null;
  longitude: number | null;
  currentQty: number;
  maxQty: number;
  soldEstimate: number;
  restockedEstimate: number;
  firstStockedAt: string | null;
  lastSeenAt: string;
}

/** Det vi trenger fra den eksisterende raden for å regne videre. */
export type ExistingStoreRow = Pick<
  BookStore,
  "maxQty" | "soldEstimate" | "restockedEstimate" | "firstStockedAt"
>;

/**
 * Regner ut neste tilstand for én butikk. Ren funksjon, så den kan testes:
 * tellerne akkumuleres fra hendelsene i denne hentingen, og «fikk boka» settes
 * første gang butikken ses med eksemplarer.
 */
export function deriveStoreRow(
  sourceKey: SourceKey,
  store: StoreStock,
  existing: ExistingStoreRow | null,
  events: StockEvent[],
  seenAt: string
): StoreRowUpdate {
  const own = events.filter((event) => event.storeId === store.storeId);
  const sold = own
    .filter((event) => event.type === "sale")
    .reduce((sum, event) => sum + event.delta, 0);
  const restocked = own
    .filter((event) => event.type === "restock")
    .reduce((sum, event) => sum + event.delta, 0);

  const previousMax = existing?.maxQty ?? 0;
  const firstStockedAt =
    existing?.firstStockedAt ?? (store.qty > 0 ? seenAt : null);

  return {
    sourceKey,
    storeId: store.storeId,
    name: store.name,
    city: store.city ?? null,
    region: store.region ?? null,
    email: store.email ?? null,
    phone: store.phone ?? null,
    address: store.address ?? null,
    postcode: store.postcode ?? null,
    schedule: store.schedule ?? null,
    latitude: store.latitude ?? null,
    longitude: store.longitude ?? null,
    currentQty: store.qty,
    maxQty: Math.max(previousMax, store.qty),
    soldEstimate: (existing?.soldEstimate ?? 0) + sold,
    restockedEstimate: (existing?.restockedEstimate ?? 0) + restocked,
    firstStockedAt,
    lastSeenAt: seenAt,
  };
}

/**
 * Butikkrader hos oss som IKKE var med i denne hentingen, men fortsatt står
 * med eksemplarer. Kjeden har tatt dem ut av lista (stengt, eller boka er
 * ikke lenger bestillbar der) — da har de ikke boka «nå», og skal ikke telle
 * som «har boka» på kart og i fylketabellen. Ren funksjon, testet.
 */
export function staleStoreIds(
  existing: Pick<BookStore, "storeId" | "currentQty">[],
  fetched: StoreStock[]
): string[] {
  const fetchedIds = new Set(fetched.map((store) => store.storeId));
  return existing
    .filter((doc) => !fetchedIds.has(doc.storeId) && (doc.currentQty ?? 0) > 0)
    .map((doc) => doc.storeId);
}

/**
 * Skriver alle butikkene fra én henting til samlingen. Én oppdatering per
 * butikk (197 hos Norli) — det er greit for en jobb som kjører én gang i
 * døgnet, og enklere å resonnere om enn en bulk-upsert med ulike verdier.
 *
 * `clearMissing`: butikker som sto med eksemplarer sist, men mangler i denne
 * lista, settes til 0 nå (maxQty og solgt-estimatet beholdes — det er
 * historikk). Slås av når lista er en lånt katalog (før lansering), for da
 * sier lista ingenting om beholdningen.
 */
export async function syncStores(
  payload: Payload,
  sourceKey: SourceKey,
  stores: StoreStock[],
  events: StockEvent[],
  seenAt: string,
  options: { clearMissing?: boolean } = {}
): Promise<{ created: number; updated: number; cleared: number }> {
  const { docs } = await payload.find({
    collection: "book-stores",
    where: { sourceKey: { equals: sourceKey } },
    limit: 1000,
    depth: 0,
    pagination: false,
  });
  const existingById = new Map(
    (docs as BookStore[]).map((doc) => [doc.storeId, doc])
  );

  let created = 0;
  let updated = 0;
  let cleared = 0;
  const seen = new Set<string>();

  for (const store of stores) {
    // Samme butikk to ganger i lista skal aldri bli to rader.
    if (seen.has(store.storeId)) continue;
    seen.add(store.storeId);

    const existing = existingById.get(store.storeId) ?? null;
    const data = deriveStoreRow(sourceKey, store, existing, events, seenAt);

    if (existing) {
      await payload.update({
        collection: "book-stores",
        id: existing.id,
        data,
      });
      updated += 1;
    } else {
      await payload.create({ collection: "book-stores", data });
      created += 1;
    }
  }

  if (options.clearMissing) {
    for (const storeId of staleStoreIds(docs as BookStore[], stores)) {
      const doc = existingById.get(storeId);
      if (!doc) continue;
      await payload.update({
        collection: "book-stores",
        id: doc.id,
        data: { currentQty: 0 },
      });
      cleared += 1;
    }
  }

  return { created, updated, cleared };
}
