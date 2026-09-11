"use client";

import { type AddToCartInput, useCart } from "@poynt/cart";
import { useEffect } from "react";

export interface RestoreCartLine extends AddToCartInput {
  quantity: number;
}

/**
 * Legger ordrelinjene fra en avbrutt Vipps-betaling tilbake i handlekurven.
 * «Kjøp nå» på produktsiden går utenom kurven, så uten dette lander kunden på
 * en tom handlekurv når avbrutt-siden lover at «handlekurven din er urørt».
 * Linjer som allerede ligger i kurven (samme produkt + variant) røres ikke,
 * så en vanlig kurv-kasse blir ikke doblet.
 */
export function RestoreCart({ lines }: { lines: RestoreCartLine[] }) {
  const addItem = useCart((state) => state.addItem);

  useEffect(() => {
    const { items } = useCart.getState();
    for (const line of lines) {
      const key = line.variantValue
        ? `${line.id}::${line.variantValue}`
        : line.id;
      if (items.some((item) => item.key === key)) continue;
      const { quantity, ...input } = line;
      addItem(input, quantity);
    }
  }, [lines, addItem]);

  return null;
}
