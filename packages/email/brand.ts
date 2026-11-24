/**
 * Eksakte Poynt-merkefarger (hex) fra den offisielle paletten
 * (poynt-assets/«Poynt - Utvidet fargepalett.pdf»). E-postklienter støtter ikke
 * oklch, så vi bruker hex direkte — men kun ekte palettverdier, ingen friheter.
 *
 * Egen fil uten React-avhengigheter, så rene hjelpere (rich-text-styles.ts)
 * kan bruke fargene uten å dra inn e-postkomponentene.
 */
export const brand = {
  bg: "#f2fafa", // Azure
  card: "#ffffff",
  panel: "#d7e1de", // Platinum
  primary: "#29664f", // Castelton Green
  ink: "#004029", // Forrest Green
  body: "#29664f", // Castelton Green
  muted: "#29664f", // Castelton Green
  border: "#d7e1de", // Platinum
  saffron: "#eac435", // Saffron
  salmon: "#ff99ad", // Salmon Pink
} as const;
