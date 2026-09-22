/**
 * Delte typer for boksalg-sporinga («Verdifull vekst – i din bedrift»,
 * ISBN 9788230375334, utgitt 15.10.2026 på Poynt forlag).
 *
 * Boka er egenutgitt, så økonomien er ikke en royaltysats: hver kanal trekker
 * sin andel, redaktøren tar en prosent av alle salg, og distribusjon og gebyr
 * spises per bok. Se lib/boksalg/economy.ts.
 */

/**
 * Én fysisk butikk slik kjeden beskriver den, med lagerbeholdningen for boka.
 * Kontaktfeltene er valgfrie fordi ikke alle kjeder gir dem — Norli gir alle.
 */
export interface StoreStock {
  /** Kjedens egen butikk-ID — stabil nøkkel på tvers av snapshot. */
  storeId: string;
  name: string;
  city?: string;
  /** Fylke, slik kjeden grupperer butikkene. */
  region?: string;
  qty: number;
  address?: string;
  postcode?: string;
  email?: string;
  phone?: string;
  /** Åpningstider som fritekst, linjer skilt med \n. */
  schedule?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Salgsstatus i nettbutikken til en kjede. «not_listed» betyr at boka ikke
 * finnes hos dem i det hele tatt — det er et annet signal enn «utsolgt».
 */
export type Availability =
  | "unknown"
  | "not_listed"
  | "preorder"
  | "in_stock"
  | "out_of_stock";

/** Ett øyeblikksbilde fra én kilde. */
export interface SourceSnapshot {
  sourceKey: string;
  fetchedAt: string;
  /** Status i kjedens nettbutikk. */
  online: Availability;
  /** Kjedens egen produkt-ID, hvis den ble slått opp. */
  externalId: string | null;
  /** Pris kjeden viser, til kontroll mot vår egen utsalgspris. */
  price: number | null;
  /** Fysiske butikker med boka. Tom liste før distribusjonen har rullet ut. */
  stores: StoreStock[];
  storesWithStock: number;
  totalCopies: number;
  /** Fritekst fra kilden når noe er verdt å notere (f.eks. utgivelsesdato). */
  note?: string;
}

/** En kilde vi kan hente lagerstatus fra. */
export interface StockSource {
  key: string;
  label: string;
  /** Kaster ved nettverks-/parsefeil; kalleren fanger per kilde. */
  fetchSnapshot(isbn: string): Promise<SourceSnapshot>;
  /**
   * Kjedens fulle butikkliste med kontaktinfo, uavhengig av boka. Brukes til å
   * fylle butikk-katalogen FØR boka er i kjedens hentesystem — da kan Susanne
   * kontakte butikker som ennå ikke har tatt den inn. Valgfri: ikke alle kjeder
   * eksponerer butikklista si.
   */
  fetchStoreDirectory?(): Promise<StoreStock[]>;
}

/**
 * En endring mellom to snapshot. Vi skiller bevisst salg fra påfyll: en butikk
 * som går fra 4 til 2 har sannsynligvis solgt 2, men en som går fra 2 til 12
 * har fått påfyll — teller vi den som «-10 salg» blir tallene meningsløse.
 */
export type StockEventType =
  | "sale"
  | "restock"
  | "listed"
  | "delisted"
  | "sold_out"
  | "availability";

export interface StockEvent {
  sourceKey: string;
  type: StockEventType;
  storeId: string | null;
  storeName: string | null;
  city: string | null;
  region: string | null;
  from: number | null;
  to: number | null;
  /** Positivt tall: antall eksemplarer bevegelsen gjelder. */
  delta: number;
  note: string | null;
}
