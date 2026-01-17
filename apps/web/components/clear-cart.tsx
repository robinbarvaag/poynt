"use client";

import { useCart } from "@poynt/cart";
import { useEffect } from "react";

export function ClearCart() {
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return null;
}
