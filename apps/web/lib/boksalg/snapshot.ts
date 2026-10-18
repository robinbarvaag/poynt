import type { BookStockSnapshot } from "@/payload-types";
import type { Payload } from "payload";
import { diffSnapshots } from "./diff";
import { findSource } from "./sources";
import { isTransientSourceError } from "./sources/http";
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
  /**
   * Kilden svarte, men ville ikke snakke med oss (429/403/botsjekk). Ikke en
   * feil i koden — forrige lagerbilde står, neste kjøring prøver igjen.
   */
  transient?: boolean;
  /** Hoppet over fordi forrige lagerbilde er ferskere enn kildens minsteintervall. */
  skipped?: boolean;
  /** Hvor gammelt forrige lagerbilde var da vi hoppet over, i minutter. */
  lastFetchedMinutesAgo?: number;
  online?: string;
  storesWithStock?: number;
  totalCopies?: number;
  events?: number;
  estimatedSales?: number;
  /** Butikk-katalogen ble hentet via et lånt produkt (boka er ikke i hentesystemet ennå). */
  directoryFallback?: boolean;
  storesSynced?: { created: number; updated: number; cleared: number };
}

export interface SnapshotRunResult {
  isbn: string;
  sources: SourceResult[];
}

/** Butikklista slik den ble lagret som JSON på lagerbildet. */
function readStores(value: BookStockSnapshot["stores"]): StoreStock[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const store = entry as Record<string, unknown>;
    if (typeof store.storeId !== "string" || typeof store.name !== "string") {
      return [];
    }
    // Eldre lagerbilder kan ha samme butikk to ganger — tell den én gang.
    if (seen.has(store.storeId)) return [];
    seen.add(store.storeId);
    const qty = typeof store.qty === "number" ? store.qty : Number(store.qty);
    return [
      {
        storeId: store.storeId,
        name: store.name,
        city: typeof store.city === "string" ? store.city : undefined,
        region: typeof store.region === "string" ? store.region : undefined,
        qty: Number.isFinite(qty) ? Math.max(0, Math.floor(qty)) : 0,
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

export interface RunOptions {
  /** Hent bare denne kilden. */
  sourceKey?: string;
  /** Hent selv om forrige lagerbilde er ferskere enn kildens minsteintervall. */
  force?: boolean;
}

export async function runStockSnapshot(
  payload: Payload,
  options: RunOptions = {}
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
      // Forrige bilde leses FØR vi spør kilden: det avgjør både om vi skal
      // spørre i det hele tatt (minsteintervall) og hva vi sammenligner mot.
      const previous = await previousSnapshot(payload, sourceKey);

      if (!options.force && source.minIntervalMs && previous) {
        const age = Date.now() - new Date(previous.fetchedAt).getTime();
        if (age >= 0 && age < source.minIntervalMs) {
          results.push({
            sourceKey,
            ok: true,
            skipped: true,
            lastFetchedMinutesAgo: Math.round(age / 60_000),
            online: previous.online,
            storesWithStock: previous.storesWithStock,
            totalCopies: previous.totalCopies,
            events: 0,
            estimatedSales: 0,
          });
          continue;
        }
      }

      const snapshot = await source.fetchSnapshot(isbn);
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
              snapshot.fetchedAt,
              // Med lånt katalog vet vi ingenting om beholdningen — da skal
              // butikker som mangler i lista ikke nullstilles.
              { clearMissing: !directoryFallback }
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
      const transient = isTransientSourceError(error);
      if (transient) {
        payload.logger.warn(`[boksalg] ${sourceKey} utilgjengelig: ${message}`);
      } else {
        payload.logger.error(`[boksalg] ${sourceKey} feilet: ${message}`);
      }
      results.push({ sourceKey, ok: false, error: message, transient });
    }
  }

  return { isbn, sources: results };
}
