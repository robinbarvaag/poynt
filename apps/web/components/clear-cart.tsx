"use client";

import { useCart } from "@poynt/cart";
import { useEffect } from "react";

/**
 * Rydder kurven etter betalt ordre. Med `purchasedIds` fjernes bare linjene
 * som faktisk ble kjøpt: Vipps-hurtigkasse fra produktsiden kjøper én vare
 * utenom kurven, og de andre varene skal bli liggende. Uten id-er (Stripe,
 * som alltid tar hele kurven) tømmes alt som før.
 */
export function ClearCart({ purchasedIds }: { purchasedIds?: string[] }) {
  const { clearCart, removeProducts } = useCart();
  // Streng-nøkkel i stedet for array-identitet, så effekten ikke kjører på nytt
  // for hver render med «samme» liste.
  const purchasedKey = purchasedIds?.join(",");

  useEffect(() => {
    if (purchasedKey === undefined) {
      clearCart();
      return;
    }
    removeProducts(purchasedKey.split(",").filter(Boolean));
    // Ble kurven tom av det, nullstill også rabattkoden (som clearCart gjør).
    if (useCart.getState().items.length === 0) clearCart();
  }, [purchasedKey, clearCart, removeProducts]);

  return null;
}
