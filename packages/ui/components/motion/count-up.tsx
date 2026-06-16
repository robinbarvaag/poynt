"use client";

import { animate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

interface CountUpProps {
  /** Sluttverdi. */
  to: number;
  /** Startverdi. Default 0. */
  from?: number;
  /** Varighet i sekunder. Default 1.5. */
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/**
 * Teller opp fra `from` til `to` når tallet kommer i viewport. Ved
 * prefers-reduced-motion vises sluttverdien direkte.
 */
export function CountUp({
  to,
  from = 0,
  duration = 1.5,
  prefix = "",
  suffix = "",
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView) {
      return;
    }
    if (reduce) {
      el.textContent = `${prefix}${to}${suffix}`;
      return;
    }
    const controls = animate(from, to, {
      duration,
      ease: "easeOut",
      onUpdate(value) {
        el.textContent = `${prefix}${Math.round(value)}${suffix}`;
      },
    });
    return () => controls.stop();
  }, [inView, reduce, from, to, duration, prefix, suffix]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {from}
      {suffix}
    </span>
  );
}
