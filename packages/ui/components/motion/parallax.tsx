"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import type { ReactNode } from "react";
import { useRef } from "react";

interface ParallaxProps {
  children: ReactNode;
  /** Maks forskyvning i hver retning over scroll-rangen (px). Default 40. */
  amount?: number;
  className?: string;
}

/**
 * Forsiktig parallax-drift basert på scroll-posisjon. Kun for dekor — aldri
 * tekst/innhold (jf. docs/DESIGN-PLAN.md). Av ved prefers-reduced-motion.
 */
export function Parallax({ children, amount = 40, className }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [amount, -amount]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y: reduce ? 0 : y }}>{children}</motion.div>
    </div>
  );
}
