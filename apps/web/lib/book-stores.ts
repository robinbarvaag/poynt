/**
 * Butikker boka selges hos — delt mellom gate-skjemaet (klient) og API-et.
 * Rekkefølgen her speiler Postgres-enumet `enum_book_access_store`, så ikke
 * stokk om på den (det gir en unødvendig migrasjon). Visningsrekkefølgen i
 * skjemaet styres av BOOK_STORES_DISPLAY.
 */
export const BOOK_STORES = [
  { value: "ark", label: "ARK" },
  { value: "norli", label: "Norli" },
  { value: "poynt", label: "poynt.no" },
] as const;

export type BookStore = (typeof BOOK_STORES)[number]["value"];

/** Rekkefølgen knappene vises i på boksiden — Norli først. */
const DISPLAY_ORDER: BookStore[] = ["norli", "ark", "poynt"];

export const BOOK_STORES_DISPLAY = [...BOOK_STORES].sort(
  (a, b) => DISPLAY_ORDER.indexOf(a.value) - DISPLAY_ORDER.indexOf(b.value)
);

export const DEFAULT_BOOK_STORE: BookStore = DISPLAY_ORDER[0];
