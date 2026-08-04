/**
 * Feature-nøkler for On Poynt — én nøkkel per funksjon som kan skrus av/på i
 * admin (globalen «On Poynt-funksjoner»). Delt modul uten server-avhengigheter,
 * så både klientkomponenter (sidebar) og server (globalen, sidevaktene) kan
 * importere den.
 */
export const FEATURE_KEYS = [
  // Verktøy (kjernereisen)
  "kanalveileder",
  "markedsplan",
  "arshjul",
  // Verktøykassa
  "siNeiMedStil",
  "svarPaHenvendelser",
  "podcastTilInnhold",
  // Øvrige områder
  "fellesskap",
  "laering",
  "kurs",
  "minBedrift",
  "minStrategi",
  "tilbakemelding",
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

export type FeatureFlags = Record<FeatureKey, boolean>;

/** Alt på — brukes til globalen aldri er lagret, og som defaultValue i admin. */
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = Object.fromEntries(
  FEATURE_KEYS.map((key) => [key, true])
) as FeatureFlags;
