import type { SourceSnapshot, StockEvent, StoreStock } from "./types";

/**
 * Sammenligner to øyeblikksbilder og skriver ut hva som faktisk skjedde.
 *
 * Dette er det ærlige hjørnet av hele sporinga. Vi måler LAGER, ikke salg:
 * en butikk som går fra 4 til 2 har sannsynligvis solgt 2, men en som går fra
 * 2 til 12 har fått påfyll. Teller vi påfyll som negativt salg blir totalen
 * meningsløs, så de to er hver sin hendelsestype og bare «sale» summeres.
 *
 * Det som ikke kan avgjøres, gjettes det ikke på:
 *  - en butikk som forsvinner fra lista blir «delisted», ikke salg. Den kan ha
 *    solgt ut OG blitt fjernet, eller butikken kan være stengt.
 *  - første snapshot gir ingen salgshendelser. Det er en nullstilling, ikke et
 *    døgns salg.
 */

function byId(stores: StoreStock[]): Map<string, StoreStock> {
  return new Map(stores.map((store) => [store.storeId, store]));
}

export function diffSnapshots(
  previous: SourceSnapshot | null,
  current: SourceSnapshot
): StockEvent[] {
  const events: StockEvent[] = [];
  const sourceKey = current.sourceKey;

  // Statusendring i nettbutikken — før utgivelse er dette den eneste
  // bevegelsen som finnes, og «gikk fra forhåndssalg til i salg» er akkurat
  // den beskjeden man vil ha.
  if (previous && previous.online !== current.online) {
    events.push({
      sourceKey,
      type: "availability",
      storeId: null,
      storeName: null,
      city: null,
      region: null,
      from: null,
      to: null,
      delta: 0,
      note: `${previous.online} → ${current.online}`,
    });
  }

  // Første snapshot er en baseline. Å skrive 128 «ny butikk»-hendelser her
  // ville fylt endringsloggen med støy på dag én.
  if (!previous) return events;

  const before = byId(previous.stores);
  const after = byId(current.stores);

  for (const store of current.stores) {
    const old = before.get(store.storeId);
    const from = old?.qty ?? 0;
    const to = store.qty;

    const common = {
      sourceKey,
      storeId: store.storeId,
      storeName: store.name,
      city: store.city ?? null,
      region: store.region ?? null,
      from,
      to,
    };

    if (!old && to > 0) {
      events.push({
        ...common,
        type: "listed",
        from: null,
        delta: to,
        note: "Boka kom inn i butikken",
      });
      continue;
    }

    if (to < from) {
      events.push({
        ...common,
        type: "sale",
        delta: from - to,
        note: to === 0 ? "Utsolgt i butikken" : null,
      });
      continue;
    }

    if (to > from) {
      events.push({
        ...common,
        type: "restock",
        delta: to - from,
        note: from === 0 ? "Påfyll etter utsolgt" : null,
      });
    }
  }

  // Butikker som var på lista med eksemplarer, og nå er borte helt.
  for (const store of previous.stores) {
    if (after.has(store.storeId) || store.qty <= 0) continue;
    events.push({
      sourceKey,
      type: "delisted",
      storeId: store.storeId,
      storeName: store.name,
      city: store.city ?? null,
      region: store.region ?? null,
      from: store.qty,
      to: null,
      delta: store.qty,
      note: "Butikken forsvant fra lista — telles ikke som salg",
    });
  }

  return events;
}

/**
 * Antall solgte eksemplarer i et sett hendelser. Kun «sale» teller: påfyll er
 * ikke negativt salg, og en butikk som forsvinner fra lista vet vi ikke nok om.
 */
export function countSales(events: StockEvent[]): number {
  return events
    .filter((event) => event.type === "sale")
    .reduce((sum, event) => sum + event.delta, 0);
}
