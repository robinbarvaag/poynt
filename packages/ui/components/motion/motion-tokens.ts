// Bevegelses-grammatikken i JS-form (for framer-motion). Speiler tokenene i
// tooling/tailwind/web.css (@theme) slik at CSS- og JS-bevegelse er identisk.
// Se docs/DESIGN-PLAN.md §3.

/** Myk easing uten bounce — samme som --ease-soft i web.css. */
export const easeSoft = [0.22, 1, 0.36, 1] as const;

/** Varigheter i sekunder (framer-motion bruker sekunder). */
export const duration = {
  fast: 0.2,
  base: 0.5,
  slow: 0.8,
} as const;

/** Hvor langt et element glir inn ved reveal (px). */
export const revealRise = 16;

/** Forskyvning mellom barn i en stagger (sekunder). */
export const staggerStep = 0.07;

/**
 * Felles viewport-innstilling for alle scroll-reveals (Reveal/Stagger — ÉN
 * kilde, ikke juster per komponent). Avveiningen har to grøfter:
 * - `amount`-brøk (f.eks. 0.2): høye seksjoner må vise mange piksler før de
 *   trigges → blank-hull på mobil (fikset i daa3212).
 * - Liten margin (-10 %): reveal fyrer i det en stripe krysser linja nær
 *   bunnkanten → animasjonen er ferdig FØR innholdet er i synsfeltet, og
 *   siden oppleves statisk («reveal kommer for tidlig»).
 * Løsning: piksel-trigging (aldri whitespace), men med trigger-linja løftet
 * til der blikket faktisk er (~18 % opp fra bunnkanten).
 */
export const revealViewport = {
  amount: "some",
  margin: "0px 0px -18% 0px",
} as const;
