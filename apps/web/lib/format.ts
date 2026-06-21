/**
 * Norsk pris, f.eks. "kr 1 490". Hele kroner uten desimaler — produktpriser
 * lagres i hele kr. Brukes i handlekurv-drawer og på kasse-siden så formatet
 * er likt overalt.
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
    maximumFractionDigits: 0,
  }).format(price);
}

/** Norsk langdato, f.eks. "3. juni 2026". Brukes på blogg-, podkast- og artikkelsider. */
export function formatLongDate(date: string): string {
  return new Date(date).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Lager en anker-id (URL-fragment) fra et blokk-navn. Gir hver blokk med et
 * «Blokk-navn» i admin en adresserbar `#anker`, slik at menyen kan lenke rett
 * til en seksjon (f.eks. /for-bedrifter#styre). Håndterer norske tegn.
 */
export function slugifyAnchor(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
