import type { Product } from "@/payload-types";
import type { Payload } from "payload";

/**
 * Delt servervalidering av kurvlinjer for begge kassene (Stripe + Vipps).
 * Håndhever det klienten bare *viser*: produktet må finnes, være aktivt og
 * ikke utsolgt, og antall klemmes til 1 når produktet ikke tillater flere.
 * Utilgjengelige produkter samles opp (ikke kastes), så kassen kan svare med
 * en vennlig melding + id-ene, og klienten kan rydde dem ut av kurven.
 */

export interface CheckoutLine {
  product: Product;
  quantity: number;
  variant?: string;
  /** Enhetspris i kr fra databasen (inkl. variant-differanse). */
  unitPrice: number;
}

export type CheckoutItemsResult =
  | { ok: true; lines: CheckoutLine[] }
  | { ok: false; error: string; unavailableIds: string[] };

interface RawItem {
  id?: unknown;
  quantity?: unknown;
  variant?: unknown;
}

export async function resolveCheckoutItems(
  payload: Payload,
  rawItems: unknown
): Promise<CheckoutItemsResult> {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { ok: false, error: "Handlekurven er tom", unavailableIds: [] };
  }

  const unavailable: { id: string; name?: string }[] = [];
  const lines: CheckoutLine[] = [];

  for (const raw of rawItems as RawItem[]) {
    const id =
      typeof raw.id === "string" || typeof raw.id === "number"
        ? String(raw.id)
        : null;
    if (!id) {
      return { ok: false, error: "Ugyldig handlekurv", unavailableIds: [] };
    }

    const product = await payload
      .findByID({ collection: "products", id })
      .catch(() => null);

    if (!product || !product.active) {
      unavailable.push({ id, name: product?.name });
      continue;
    }
    if (product.statusBadge === "soldout") {
      unavailable.push({ id, name: product.name });
      continue;
    }

    const variant = typeof raw.variant === "string" ? raw.variant : undefined;
    const variantOption = variant
      ? (product.variantOptions ?? []).find((o) => o.label === variant)
      : undefined;

    const requested = Math.max(
      1,
      Math.floor(typeof raw.quantity === "number" ? raw.quantity : 1)
    );
    // Klienten viser maks 1 for produkter uten antall-velger — serveren må
    // håndheve det samme, ellers kan en håndlaget POST kjøpe 50 stk.
    const quantity = product.allowQuantity ? Math.min(requested, 99) : 1;

    lines.push({
      product,
      quantity,
      variant,
      unitPrice: product.price + (variantOption?.priceDelta ?? 0),
    });
  }

  if (unavailable.length > 0) {
    const names = unavailable
      .map((u) => u.name)
      .filter(Boolean)
      .join(", ");
    return {
      ok: false,
      error: names
        ? `${names} er dessverre ikke tilgjengelig lenger. Vi har fjernet ${unavailable.length === 1 ? "det" : "dem"} fra handlekurven.`
        : "Et av produktene i handlekurven er ikke tilgjengelig lenger. Vi har fjernet det fra handlekurven.",
      unavailableIds: unavailable.map((u) => u.id),
    };
  }

  return { ok: true, lines };
}
