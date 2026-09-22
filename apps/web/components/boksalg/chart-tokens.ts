/**
 * Datafargene i boksalg-dashbordet.
 *
 * Merkevarefargene til Poynt (#29664f, #eac435, #ff99ad, #abe3e3) er flate- og
 * aksentfarger: som datamerker faller de på både lyshetsbånd, kromafloor og
 * kontrast mot hvit. Disse er steget ned i samme hue-familier til de består
 * alle seks sjekkene — lyshet, kroma, fargeblind-separasjon (ΔE 9,0 protan),
 * normalsyn (ΔE 19,6) og kontrast (begge ≥ 3:1 mot hvit).
 *
 * Endres en av dem, kjør palettvalidatoren på nytt før det committes.
 */

/** Faktiske tall: solgt inn, beholdning, utgifter. */
export const EXACT = "#00794e";

/** Estimater utledet av at butikkenes lagerbeholdning gikk ned. Skraveres i tillegg. */
export const ESTIMATE = "#b07d06";

/** Statusfarger for butikker — alltid sammen med tekst, aldri farge alene. */
export const STATUS_COLORS = {
  har_boka: EXACT,
  gatt_tom: ESTIMATE,
  ikke_hatt: "#8a9a93",
} as const;

/** Id-en til skravur-mønsteret som markerer estimerte tall. */
export const HATCH_ID = "boksalg-hatch";
