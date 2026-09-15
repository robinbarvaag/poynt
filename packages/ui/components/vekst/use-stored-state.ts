"use client";

import { type Dispatch, type SetStateAction, useEffect, useState } from "react";

/**
 * `useState` som huskes i nettleseren (localStorage). Første render bruker
 * alltid `initial`, så server og klient rendrer likt; lagret verdi lastes
 * etter mount. `key = null` betyr «ikke lagre ennå» (f.eks. før ukenummeret
 * er kjent på klienten). Alt er pakket i try/catch: privat modus og blokkert
 * lagring gir bare en vanlig, glemsom state.
 */
export function useStoredState<T>(
  key: string | null,
  initial: T,
  parse: (raw: unknown) => T | null = (raw) => raw as T
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initial);
  // Hvilken nøkkel som er ferdig lastet. Lagring venter til lastingen har
  // slått inn, ellers ville første skriving overskrive det som lå der.
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `parse` og `initial` leses bare når nøkkelen byttes
  useEffect(() => {
    if (!key) return;
    try {
      const raw = window.localStorage.getItem(key);
      const parsed = raw === null ? null : parse(JSON.parse(raw));
      setValue(parsed ?? initial);
    } catch {
      setValue(initial);
    }
    setLoadedKey(key);
  }, [key]);

  useEffect(() => {
    if (!key || loadedKey !== key) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Lagring er en bekvemmelighet, ikke et krav.
    }
  }, [key, loadedKey, value]);

  return [value, setValue];
}
