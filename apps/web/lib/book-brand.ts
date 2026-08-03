import type { ChapterPalette } from "@poynt/ui";

/**
 * Fargene til boka «Verdifull vekst». Boka har sin EGEN identitet (lilla og
 * oliven) – den skal ikke tvinges inn i Poynt-grønt, og Poynt-paletten skal
 * ikke utvides med bokfarger.
 *
 * Verdiene er sampla fra omslags-rendringene på produktet (p95-lysstyrke
 * innenfor hver fargegruppe, for å kompensere for at rendringene er belyst med
 * skygger). De er altså NÆRE, ikke fasit: har Susanne de eksakte hex-kodene fra
 * omslagsdesignet, er det bare å bytte dem her – dette er eneste sted de bor.
 */
export const BOOK_PALETTE: ChapterPalette = {
  surface: "#cdc1da",
  ink: "#33174a",
  inkSoft: "color-mix(in oklab, #33174a 72%, transparent)",
  ghost: "color-mix(in oklab, #33174a 14%, transparent)",
  accent: "#cbcd8e",
  accentInk: "#33174a",
};
