/** Butikker boka selges hos — delt mellom gate-skjemaet (klient) og API-et. */
export const BOOK_STORES = [
  { value: "ark", label: "ARK" },
  { value: "norli", label: "Norli" },
  { value: "annet", label: "Annet sted" },
] as const;

export type BookStore = (typeof BOOK_STORES)[number]["value"];
