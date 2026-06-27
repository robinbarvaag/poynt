"use client";

import { useEffect } from "react";

/** Gjør et fontnavn om til Google Fonts-URL-segmentet (mellomrom → +). */
function toFamilyParam(family: string): string {
  return family.trim().replace(/\s+/g, "+");
}

/**
 * Laster en Google Font dynamisk for live forhåndsvisning av merkevare-fonter.
 * Injiserer én delt `<link>` per familie i `<head>` (idempotent — flere
 * specimens med samme font deler samme lenke). No-op på server og for tomme navn.
 *
 * Dette er kun for visning; vi antar at de fleste merkevare-fonter finnes på
 * Google Fonts. Finnes den ikke der, faller nettleseren pent tilbake til
 * font-family-stacken (serif/sans-serif).
 */
export function useWebFont(family?: string | null): void {
  useEffect(() => {
    if (!family || typeof document === "undefined") return;
    const param = toFamilyParam(family);
    if (!param) return;

    const id = `poynt-webfont-${param.toLowerCase()}`;
    if (document.getElementById(id)) return;

    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${param}:wght@400;500;600;700&display=swap`;
    document.head.appendChild(link);
    // Lenken beholdes bevisst (delt cache på tvers av komponenter).
  }, [family]);
}
