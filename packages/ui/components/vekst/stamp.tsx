"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export type StampTone = "alarm" | "good" | "ink";

const TONE: Record<StampTone, string> = {
  alarm: "text-[#b3264f]",
  good: "text-primary",
  ink: "text-foreground",
};

export interface StampProps {
  children: ReactNode;
  tone?: StampTone;
  /** Ny nøkkel = stempelet slås ned på nytt. Default er teksten. */
  stampKey?: string;
  className?: string;
}

/**
 * Skrått stempel («TAPER PENGER», «LØGN #3») som slås ned med en kort spring
 * når verdien endres. Første visning står stille, så siden er rolig i hvile.
 */
export function Stamp({
  children,
  tone = "ink",
  stampKey,
  className,
}: StampProps) {
  const reduceMotion = useReducedMotion();
  const key = stampKey ?? (typeof children === "string" ? children : "stamp");

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={key}
        className={cn(
          "inline-block select-none whitespace-nowrap rounded-lg border-[3px] border-current px-3 py-1 font-extrabold font-heading text-sm uppercase leading-none tracking-[0.14em]",
          TONE[tone],
          className
        )}
        initial={
          reduceMotion
            ? { opacity: 0, rotate: -7 }
            : { opacity: 0, scale: 1.7, rotate: -16 }
        }
        animate={{ opacity: 1, scale: 1, rotate: -7 }}
        exit={{ opacity: 0, transition: { duration: 0.1 } }}
        transition={
          reduceMotion
            ? { duration: 0.15 }
            : { type: "spring", stiffness: 520, damping: 24 }
        }
      >
        {children}
      </motion.span>
    </AnimatePresence>
  );
}
