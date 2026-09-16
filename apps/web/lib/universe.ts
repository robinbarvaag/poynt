/**
 * «Verdifull vekst-universet» er en egen verden inne i poynt.no: siden eier sin
 * egen ramme (app/(univers)) med en rolig header som peker innover i universet,
 * og poynt.no som en diskret utgang. Innholdet er den vanlige Payload-sida med
 * slug-en under — universet er bare en annen hatt på samme side.
 *
 * Slug-en står her fordi to ruter må være enige om den: universets egen rute,
 * og catch-all-ruta i (frontend) som må la være å generere den.
 */
export const UNIVERSE = {
  slug: "verdifull-vekst-universet",
  /** Vises ved siden av logoen i headeren. */
  label: "Verdifull vekst",
} as const;

/** Universets forside — dit logoen i headeren peker. */
export const universeHome = `/${UNIVERSE.slug}`;
