import {
  EMPTY_SHIPPING_INPUT,
  type ShippingAddressInput,
} from "./shipping-address";

// Adressen huskes i sessionStorage (ikke localStorage: det er persondata) så
// den overlever en avbrutt betaling og «tilbake» fra Stripe/Vipps, og deles
// mellom handlekurv-siden og Vipps-vinduet på produktsiden/i kurvskuffen.
const SHIPPING_STORAGE_KEY = "poynt-shipping";

export function readStoredShipping(): ShippingAddressInput {
  if (typeof window === "undefined") return EMPTY_SHIPPING_INPUT;
  try {
    const raw = window.sessionStorage.getItem(SHIPPING_STORAGE_KEY);
    if (!raw) return EMPTY_SHIPPING_INPUT;
    const parsed = JSON.parse(raw) as Partial<ShippingAddressInput>;
    return { ...EMPTY_SHIPPING_INPUT, ...parsed };
  } catch {
    return EMPTY_SHIPPING_INPUT;
  }
}

export function writeStoredShipping(value: ShippingAddressInput): void {
  try {
    window.sessionStorage.setItem(SHIPPING_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Privat modus / full lagring — adressen lever da bare i skjemaet.
  }
}
