import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  /** Unik linje-nøkkel: produkt-id, ev. suffikset med variantvalg. */
  key: string;
  /** Produkt-id (delt av varianter av samme produkt). */
  id: string;
  name: string;
  /** Enhetspris i kr (inkl. ev. variant-differanse). */
  price: number;
  quantity: number;
  /** Valgfri miniatyr-url — vises som produktbilde i handlekurven. */
  image?: string;
  /** Variant-spørsmål, f.eks. «Signert?». */
  variantLabel?: string;
  /** Valgt variant, f.eks. «Ja». */
  variantValue?: string;
  /** Maks antall per linje (f.eks. 1 for digitale engangsprodukter). */
  maxQuantity?: number;
}

/** Rabattkode validert av serveren (/api/coupon) — følger kurven i alle kasser. */
export interface AppliedCoupon {
  code: string;
  percentOff: number | null;
  amountOffKr: number | null;
  label: string;
}

/** Det den som legger i kurven oppgir – `key`/`quantity` blir utledet. */
export interface AddToCartInput {
  id: string;
  name: string;
  price: number;
  image?: string;
  variantLabel?: string;
  variantValue?: string;
  maxQuantity?: number;
}

function lineKey(id: string, variantValue?: string): string {
  return variantValue ? `${id}::${variantValue}` : id;
}

function clampQuantity(quantity: number, max?: number): number {
  const floored = Math.max(1, Math.floor(quantity));
  return max != null ? Math.min(floored, max) : floored;
}

interface CartState {
  items: CartItem[];
  /** Aktiv rabattkode — settes fra handlekurv-siden, leses av alle kasser. */
  coupon: AppliedCoupon | null;
  /** Legg til (eller slå sammen med eksisterende linje av samme variant). */
  addItem: (input: AddToCartInput, quantity?: number) => void;
  /** Sett eksakt antall på en linje (klemt mot maxQuantity). */
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  setCoupon: (coupon: AppliedCoupon | null) => void;
  /** Fjern linjer for gitte produkt-id-er (f.eks. produkter som er borte). */
  removeProducts: (ids: string[]) => void;
  clearCart: () => void;
  /** Sum (pris × antall) for hele kurven. */
  total: () => number;
  /** Totalt antall varer (sum av antall). */
  count: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      addItem: (input, quantity = 1) => {
        set((state) => {
          const key = lineKey(input.id, input.variantValue);
          const existing = state.items.find((i) => i.key === key);

          if (existing) {
            return {
              items: state.items.map((i) =>
                i.key === key
                  ? {
                      ...i,
                      quantity: clampQuantity(
                        i.quantity + quantity,
                        i.maxQuantity
                      ),
                    }
                  : i
              ),
            };
          }

          return {
            items: [
              ...state.items,
              {
                key,
                id: input.id,
                name: input.name,
                price: input.price,
                quantity: clampQuantity(quantity, input.maxQuantity),
                image: input.image,
                variantLabel: input.variantLabel,
                variantValue: input.variantValue,
                maxQuantity: input.maxQuantity,
              },
            ],
          };
        });
      },
      updateQuantity: (key, quantity) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.key === key
              ? { ...i, quantity: clampQuantity(quantity, i.maxQuantity) }
              : i
          ),
        }));
      },
      removeItem: (key) => {
        set((state) => ({
          items: state.items.filter((i) => i.key !== key),
        }));
      },
      setCoupon: (coupon) => set({ coupon }),
      removeProducts: (ids) => {
        set((state) => ({
          items: state.items.filter((i) => !ids.includes(i.id)),
        }));
      },
      clearCart: () => set({ items: [], coupon: null }),
      total: () =>
        get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      count: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: "poynt-cart",
      // v2: linjer har nå key/quantity/variant. Gamle (v1) kurver er
      // inkompatible – tøm dem (trygt før lansering).
      version: 2,
      migrate: () => ({ items: [] }) as Partial<CartState>,
    }
  )
);

interface CartUiState {
  /** Om handlekurv-draweren er åpen. */
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Åpne draweren – kalles av «Legg i handlekurv» som kjøpsbekreftelse. */
  openCart: () => void;
}

/**
 * UI-tilstand for handlekurven (drawer åpen/lukket). Bevisst IKKE persistert –
 * kurv-innholdet overlever refresh, men en åpen drawer skal ikke gjøre det.
 * Deles mellom drawer-triggeren i headeren og «Legg i handlekurv»-knappene,
 * slik at et kjøp kan åpne draweren som bekreftelse.
 */
export const useCartUi = create<CartUiState>()((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  openCart: () => set({ open: true }),
}));
