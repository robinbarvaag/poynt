/** Butikker boka selges hos — delt mellom gate-skjemaet (klient) og API-et. */
export const BOOK_STORES = [
  { value: "ark", label: "ARK" },
  { value: "norli", label: "Norli" },
  { value: "poynt", label: "poynt.no" },
] as const;

export type BookStore = (typeof BOOK_STORES)[number]["value"];
