import type { Product } from "@/payload-types";

export * from "./shipping-address";

/**
 * Kurven trenger leveringsadresse når minst ett produkt er merket «Krever
 * frakt» i admin. Avgjøres på serveren ut fra produktene, aldri av klienten
 * (kurven i nettleseren har samme flagg bare for å vise skjemaet tidlig).
 */
export function cartNeedsShipping(
  lines: { product: Pick<Product, "requiresShipping"> }[]
): boolean {
  return lines.some((line) => line.product.requiresShipping === true);
}
