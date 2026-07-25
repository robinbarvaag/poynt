import type * as React from "react";
import { cn } from "../../lib/utils";

/**
 * Bibliotek av organiske former (asymmetrisk border-radius). Den siste er en
 * perfekt sirkel — dukker opp av og til for variasjon.
 */
const SHAPES = [
  "58% 42% 55% 45% / 55% 48% 52% 45%",
  "45% 55% 62% 38% / 50% 42% 58% 50%",
  "62% 38% 46% 54% / 42% 58% 44% 56%",
  "38% 62% 50% 50% / 60% 40% 55% 45%",
  "52% 48% 40% 60% / 46% 60% 40% 54%",
  "60% 40% 58% 42% / 38% 55% 45% 62%",
  "50% 50% 50% 50% / 50% 50% 50% 50%",
];

/** FNV-1a-hash av en streng → uint32. Stabil på tvers av server og klient. */
export function hashSeed(seed: string | number): number {
  const str = String(seed);
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 — deterministisk PRNG, så SSR og klient gir identisk form. */
function seededRandom(seed: string | number): () => number {
  let a = hashSeed(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface DecoBlobProps {
  /** Stabil nøkkel (f.eks. produkt-href/slug) — samme seed gir alltid samme form. */
  seed: string | number;
  /** Basisstørrelse i px. Faktisk størrelse varierer ±25 % ut fra seed. */
  size?: number;
  /** Posisjonering + farge, f.eks. "-top-3 -right-3 absolute bg-accent-1". */
  className?: string;
}

/**
 * Dekorativ organisk blob (INSPO/Steady-signaturen) med seeded variasjon:
 * form, størrelse, rotasjon og animasjonstempo utledes deterministisk fra
 * `seed`, så hvert produkt får sin egen «personlighet» — av og til helt rund.
 * Morpher sakte mellom to former (se `.deco-blob` i web.css); står stille
 * ved prefers-reduced-motion.
 */
export function DecoBlob({ seed, size = 96, className }: DecoBlobProps) {
  const rand = seededRandom(seed);
  const pick = () => SHAPES[Math.floor(rand() * SHAPES.length)];

  const shapeA = pick();
  const shapeB = pick();
  const shapeC = pick();
  const scale = 0.75 + rand() * 0.55;
  const duration = 9 + rand() * 8;
  // Negativ delay: hver blob starter et vilkårlig sted i sin egen syklus,
  // så et rutenett aldri pulserer i takt.
  const delay = -(rand() * duration);
  const rotation = Math.round(rand() * 360);

  return (
    <span
      aria-hidden="true"
      className={cn("deco-blob", className)}
      style={
        {
          width: Math.round(size * scale),
          height: Math.round(size * scale),
          rotate: `${rotation}deg`,
          "--blob-a": shapeA,
          "--blob-b": shapeB,
          "--blob-c": shapeC,
          "--blob-dur": `${duration.toFixed(1)}s`,
          animationDelay: `${delay.toFixed(1)}s`,
        } as React.CSSProperties
      }
    />
  );
}
