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

/** Enkel css-streng-escape så font-URL/familie ikke kan bryte ut av @font-face. */
function cssSafe(value: string): string {
  return value.replace(/["\\]/g, "\\$&");
}

/**
 * Laster en egen-opplastet font via @font-face for live forhåndsvisning.
 * Injiserer én delt `<style>` per familie+url i `<head>` (idempotent). No-op på
 * server, for tomme navn eller manglende url. Brukes for fonter brukeren har
 * lastet opp selv (woff/woff2), i motsetning til Google Fonts (`useWebFont`).
 */
export function useCustomFont(
  family?: string | null,
  url?: string | null
): void {
  useEffect(() => {
    if (!family || !url || typeof document === "undefined") return;

    const id = `poynt-customfont-${family.toLowerCase().replace(/\s+/g, "-")}`;
    const existing = document.getElementById(id);
    // Samme familie kan peke på en ny url (re-opplasting) — oppdater da kilden.
    if (existing?.dataset.url === url) return;

    const style = existing ?? document.createElement("style");
    style.id = id;
    style.dataset.url = url;
    style.textContent = `@font-face{font-family:"${cssSafe(family)}";src:url("${cssSafe(url)}");font-display:swap;}`;
    if (!existing) document.head.appendChild(style);
  }, [family, url]);
}
