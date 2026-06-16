"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "../../lib/utils";

interface DriftingBlobProps {
  className?: string;
  /** Drift-varighet i sekunder. Default 18. */
  duration?: number;
}

/**
 * Den seksjons-bindende organiske formen (jf. docs/DESIGN-PLAN.md §1). Driver
 * sakte i bakgrunnen — «alt puster». Dekorativ (aria-hidden), står stille ved
 * prefers-reduced-motion. Plasser i en `relative`-container og gi farge +
 * posisjon via className (f.eks. `bg-primary/20 -top-10 left-0 size-72`).
 */
export function DriftingBlob({ className, duration = 18 }: DriftingBlobProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute rounded-[60%_40%_55%_45%/50%_60%_40%_50%] blur-2xl",
        className
      )}
      animate={
        reduce
          ? undefined
          : {
              x: [0, 20, -10, 0],
              y: [0, -15, 10, 0],
              scale: [1, 1.05, 0.97, 1],
            }
      }
      transition={{
        duration,
        ease: "easeInOut",
        repeat: Number.POSITIVE_INFINITY,
      }}
    />
  );
}
