"use client";

import {
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import type React from "react";

// Rolig fjær: nok etterslep til at objektet føles som noe fysisk med vekt, men
// uten synlig svingning når pekeren stopper.
const tiltSpring = { stiffness: 120, damping: 18, mass: 0.6 } as const;

/**
 * Vipper et element mot pekeren. Delt av bokomslaget og kapittelkortet, så de
 * to objektene i heroen har nøyaktig samme fysikk.
 *
 * Bevisste valg: fjærbasert (ikke låst 1:1 til musa, som føles kunstig), full
 * `transform`-streng (komposittlag på GPU, ikke x/y-shorthands på hovedtråden),
 * og helt av ved `prefers-reduced-motion` eller på berøring — der finnes ingen
 * peker å vippe mot.
 */
export function useTilt({ max = 12 }: { max?: number } = {}) {
  const reduce = useReducedMotion();

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rotateY = useSpring(rawX, tiltSpring);
  const rotateX = useSpring(rawY, tiltSpring);
  const glareX = useSpring(useMotionValue(50), tiltSpring);

  const transform = useMotionTemplate`perspective(1600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  const glare = useMotionTemplate`linear-gradient(105deg, transparent ${glareX}%, rgba(255,255,255,0.42) calc(${glareX}% + 8%), transparent calc(${glareX}% + 22%))`;

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (reduce || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    rawX.set((px - 0.5) * 2 * max);
    rawY.set((0.5 - py) * 2 * (max * 0.6));
    glareX.set(px * 100);
  }

  function onPointerLeave() {
    rawX.set(0);
    rawY.set(0);
    glareX.set(50);
  }

  return { transform, glare, handlers: { onPointerMove, onPointerLeave } };
}
