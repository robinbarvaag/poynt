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
