import type { BookStockSnapshot } from "@/payload-types";
import type { Payload } from "payload";
import { diffSnapshots } from "./diff";
import { findSource } from "./sources";
import { syncStores } from "./stores";
import type { SourceSnapshot, StockEvent, StoreStock } from "./types";

/**
 * Henter lagerstatus fra bokhandlerne, lagrer et lagerbilde per kilde og
 * skriver én rad i endringsloggen per ting som faktisk endret seg.
 *
 * Kjøres av cron hver morgen (lib/inngest/functions/book-stock.ts) og fra
 * «Hent nå»-knappen i dashbordet. Idempotent nok til å tåle to kjøringer
 * samme dag: andre kjøring sammenlignes mot den første og gir null endringer
 * hvis ingenting har skjedd i mellomtiden.
 */

type SourceKey = BookStockSnapshot["sourceKey"];

export interface SourceResult {
  sourceKey: SourceKey;
  ok: boolean;
  error?: string;
  online?: string;
  storesWithStock?: number;
  totalCopies?: number;
  events?: number;
  estimatedSales?: number;
  /** Butikk-katalogen ble hentet via et lånt produkt (boka er ikke i hentesystemet ennå). */
  directoryFallback?: boolean;
  storesSynced?: { created: number; updated: number };
}

export interface SnapshotRunResult {
  isbn: string;
  sources: SourceResult[];
}

/** Butikklista slik den ble lagret som JSON på lagerbildet. */
function readStores(value: BookStockSnapshot["stores"]): StoreStock[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const store = entry as Record<string, unknown>;
    if (typeof store.storeId !== "string" || typeof store.name !== "string") {
      return [];
    }
    return [
      {
        storeId: store.storeId,
        name: store.name,
        city: typeof store.city === "string" ? store.city : undefined,
        region: typeof store.region === "string" ? store.region : undefined,
        qty: typeof store.qty === "number" ? store.qty : 0,
      },
    ];
  });
}

/** Gjenskaper forrige lagerbilde fra det som ligger i databasen. */
function toSourceSnapshot(doc: BookStockSnapshot): SourceSnapshot {
  return {
    sourceKey: doc.sourceKey,
    fetchedAt: doc.fetchedAt,
    online: doc.online,
    externalId: doc.externalId ?? null,
    price: doc.price ?? null,
    stores: readStores(doc.stores),
    storesWithStock: doc.storesWithStock ?? 0,
    totalCopies: doc.totalCopies ?? 0,
  };
}

async function previousSnapshot(
  payload: Payload,
  sourceKey: SourceKey
): Promise<SourceSnapshot | null> {
  const { docs } = await payload.find({
    collection: "book-stock-snapshots",
    where: { sourceKey: { equals: sourceKey } },
    sort: "-fetchedAt",
    limit: 1,
    depth: 0,
  });
  const doc = (docs as BookStockSnapshot[])[0];
  return doc ? toSourceSnapshot(doc) : null;
}

async function writeEvents(
  payload: Payload,
  events: StockEvent[],
  occurredAt: string
): Promise<void> {
  for (const event of events) {
    await payload.create({
      collection: "book-stock-events",
      data: {
        occurredAt,
        sourceKey: event.sourceKey as SourceKey,
        type: event.type,
        storeId: event.storeId,
        storeName: event.storeName,
        city: event.city,
        region: event.region,
        fromQty: event.from,
        toQty: event.to,
        delta: event.delta,
        note: event.note,
      },
    });
  }
}

export async function runStockSnapshot(
  payload: Payload,
  options: { sourceKey?: string } = {}
): Promise<SnapshotRunResult> {
  const economy = await payload.findGlobal({ slug: "book-economy", depth: 0 });
  const isbn = (economy.isbn ?? "").trim();

  if (!isbn) {
    throw new Error("ISBN mangler i Bokøkonomi — kan ikke hente lagertall");
  }

  const wanted = (economy.sources ?? []).filter(
    (source) =>
      source.active !== false &&
      (!options.sourceKey || source.sourceKey === options.sourceKey)
  );

  const results: SourceResult[] = [];

  for (const { sourceKey } of wanted) {
    const source = findSource(sourceKey);
    if (!source) {
      results.push({
        sourceKey,
        ok: false,
        error: `Ukjent kilde «${sourceKey}»`,
      });
      continue;
    }

    try {
      const snapshot = await source.fetchSnapshot(isbn);
      const previous = await previousSnapshot(payload, sourceKey);
      const events = diffSnapshots(previous, snapshot);

      await payload.create({
        collection: "book-stock-snapshots",
        data: {
          sourceKey,
          fetchedAt: snapshot.fetchedAt,
          online: snapshot.online,
          externalId: snapshot.externalId,
          price: snapshot.price,
          storeCount: snapshot.stores.length,
          storesWithStock: snapshot.storesWithStock,
          totalCopies: snapshot.totalCopies,
          note: snapshot.note ?? null,
          stores: snapshot.stores,
        },
      });

      await writeEvents(payload, events, snapshot.fetchedAt);

      // Butikk-katalogen. Før lansering svarer kjeden med tom liste for vår
      // bok — da låner vi et annet produkt for å få butikkene (med qty 0), så
      // Susanne kan begynne å kontakte dem. Etter lansering kommer alle
      // butikkene med i vårt eget snapshot og fallbacken brukes ikke.
      let directoryFallback = false;
      let stores = snapshot.stores;
      if (stores.length === 0 && source.fetchStoreDirectory) {
        stores = await source.fetchStoreDirectory();
        directoryFallback = true;
      }
      const storesSynced =
        stores.length > 0
          ? await syncStores(
              payload,
              sourceKey,
              stores,
              events,
              snapshot.fetchedAt
            )
          : undefined;

      results.push({
        sourceKey,
        ok: true,
        online: snapshot.online,
        storesWithStock: snapshot.storesWithStock,
        totalCopies: snapshot.totalCopies,
        events: events.length,
        estimatedSales: events
          .filter((event) => event.type === "sale")
          .reduce((sum, event) => sum + event.delta, 0),
        directoryFallback,
        storesSynced,
      });
    } catch (error) {
      // Én kilde som feiler skal ikke ta med seg de andre. Feilen lagres i
      // resultatet og logges — vi skriver bevisst ikke et tomt lagerbilde,
      // for da ville neste kjøring lest det som «alle butikker tømt».
      const message = error instanceof Error ? error.message : String(error);
      payload.logger.error(`[boksalg] ${sourceKey} feilet: ${message}`);
      results.push({ sourceKey, ok: false, error: message });
    }
  }

  return { isbn, sources: results };
}
