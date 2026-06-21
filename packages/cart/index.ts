import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  /** Unik linje-nøkkel: produkt-id, ev. suffiks med variantvalg. */
  key: string;
  /** Produkt-id (delt av variantar av same produkt). */
  id: string;
  name: string;
  /** Einingspris i kr (inkl. ev. variant-differanse). */
  price: number;
  quantity: number;
  /** Valgfri miniatyr-url — vises som produktbilde i handlekurven. */
  image?: string;
  /** Variant-spørsmål, t.d. «Signert?». */
  variantLabel?: string;
  /** Valgt variant, t.d. «Ja». */
  variantValue?: string;
  /** Maks antal per linje (t.d. 1 for digitale eingongsprodukt). */
  maxQuantity?: number;
}

/** Det den som legg i kurven oppgir – `key`/`quantity` blir utleidd. */
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
  /** Legg til (eller slå saman med eksisterande linje av same variant). */
  addItem: (input: AddToCartInput, quantity?: number) => void;
  /** Sett eksakt antal på ei linje (klemt mot maxQuantity). */
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
  /** Sum (pris × antal) for heile kurven. */
  total: () => number;
  /** Totalt tal varer (sum av antal). */
  count: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
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
      clearCart: () => set({ items: [] }),
      total: () =>
        get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      count: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: "poynt-cart",
      // v2: linjer har no key/quantity/variant. Gamle (v1) kurver er
      // inkompatible – tøm dei (trygt før lansering).
      version: 2,
      migrate: () => ({ items: [] }) as Partial<CartState>,
    }
  )
);
