import type { CSSProperties } from "react";
import type { ChapterPalette } from "../marketing/chapter-rotator";
import type { Zone } from "./logic";

/**
 * Bokas fargesoner. Samme tre farger i alle vekst-blokkene, så leseren lærer
 * skalaen én gang: rosa = start her, gul = nummer to, grønn = sterkt.
 * Tekst oppå sonene er alltid `text-foreground`.
 */
export const ZONE_COLORS: Record<Zone, string> = {
  rosa: "#f7c6d1",
  gul: "#f4df94",
  gronn: "#c3e3b5",
};

export const ZONE_LABELS: Record<Zone, string> = {
  rosa: "Start her",
  gul: "Nummer to",
  gronn: "Sterkt område",
};

/**
 * Ringene i endringshjulet, som i boka: hvert område er delt i tre ringer.
 * Ett ja tegner den ytterste (lilla), to ja den gule, tre ja den grønne i
 * midten. Rekkefølgen er utenfra og inn, og fargene er faste uansett palett –
 * de betyr noe, akkurat som sonene.
 */
export interface WheelRing {
  color: string;
  /** Hva det betyr å ha kommet hit. */
  label: string;
}

export const WHEEL_RINGS: WheelRing[] = [
  { color: "#cdc1da", label: "Her bør du starte" },
  { color: "#f2ecab", label: "Kunne vært bedre" },
  { color: "#cae0b7", label: "Her er du god" },
];

/** Ringen et område har nådd. 0 fylte ringer leses som «start her». */
export function wheelRing(rings: number): WheelRing {
  return WHEEL_RINGS[Math.min(WHEEL_RINGS.length, Math.max(1, rings)) - 1];
}

/**
 * Paletten som CSS-variabler på blokkens rot. Komponentene bruker bare
 * variablene (`bg-[var(--vk-surface)]`), så samme blokk kan stå i bokas lilla
 * og oliven eller i Poynt-grønt uten egne varianter.
 *
 * Par som hører sammen: surface/ink/inkSoft/ghost og accent/accentInk.
 */
export function vekstVars(palette: ChapterPalette): CSSProperties {
  return {
    "--vk-surface": palette.surface,
    "--vk-ink": palette.ink,
    "--vk-ink-soft": palette.inkSoft,
    "--vk-ghost": palette.ghost,
    "--vk-accent": palette.accent,
    "--vk-accent-ink": palette.accentInk,
    "--vk-rosa": ZONE_COLORS.rosa,
    "--vk-gul": ZONE_COLORS.gul,
    "--vk-gronn": ZONE_COLORS.gronn,
  } as CSSProperties;
}

export const ZONE_BG: Record<Zone, string> = {
  rosa: "bg-[var(--vk-rosa)]",
  gul: "bg-[var(--vk-gul)]",
  gronn: "bg-[var(--vk-gronn)]",
};
