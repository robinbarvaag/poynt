"use client";

import { useEffect, useState } from "react";

/**
 * True først etter at klienten har montert. Handlekurven persisteres i
 * localStorage (Zustand `persist`), så server og første klient-render må
 * behandle den som tom — ellers spriker React-treet og gir hydration-feil
 * (bl.a. desync av Radix sin `useId` på handlekurv-triggeren). Gate all
 * cart-avhengig rendring bak denne: `const ready = useCartReady()`.
 */
export function useCartReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  return ready;
}
