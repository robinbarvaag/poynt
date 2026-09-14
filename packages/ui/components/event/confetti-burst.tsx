"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "../../lib/utils";

export interface ConfettiBurstProps {
  /** Antall biter. */
  pieces?: number;
  className?: string;
}

const COLORS = [
  "bg-accent-1",
  "bg-accent-2",
  "bg-accent-3",
  "bg-primary",
] as const;

/**
 * Ett lite konfetti-smell når påmeldingen går gjennom — delight-budsjettet
 * brukes på toppunktet, ikke overalt. Ingen tilfeldighet (stabilt mellom
 * render), og ingenting beveger seg for dem som har skrudd av animasjoner.
 */
export function ConfettiBurst({ pieces = 26, className }: ConfettiBurstProps) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-x-0 top-6 flex justify-center",
        className
      )}
    >
      {Array.from({ length: pieces }, (_, i) => {
        const angle = (i / pieces) * Math.PI * 2;
        const distance = 90 + ((i * 37) % 70);
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance * 0.7 - 40;
        return (
          <motion.span
            // biome-ignore lint/suspicious/noArrayIndexKey: fast, ikke-sortert liste
            key={i}
            className={cn(
              "absolute block rounded-[2px]",
              COLORS[i % COLORS.length],
              i % 3 === 0 ? "h-2 w-2 rounded-full" : "h-3 w-1.5"
            )}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.6 }}
            animate={{
              x,
              y: [y, y + 120],
              opacity: [1, 1, 0],
              rotate: (i % 2 === 0 ? 1 : -1) * (180 + i * 20),
              scale: 1,
            }}
            transition={{
              duration: 1.4,
              ease: [0.22, 1, 0.36, 1],
              delay: (i % 5) * 0.02,
            }}
          />
        );
      })}
    </div>
  );
}
