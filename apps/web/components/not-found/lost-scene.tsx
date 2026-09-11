"use client";

import {
  motion,
  motionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import type React from "react";
import { useState } from "react";

/** Diameter på den rosa flekken i px. */
const GLOW_SIZE = 560;

/**
 * Scenen for 404-siden: rolig flate med en svak, blurra rosa flekk som
 * følger pekeren med litt etterslep. Flekken står i ro midt i scenen når
 * musa er utenfor, på berøring og ved prefers-reduced-motion. Innholdet
 * (barn) ligger over.
 */
export function LostScene({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const [target] = useState(() => ({
    x: motionValue(0),
    y: motionValue(0),
  }));
  const x = useSpring(target.x, { stiffness: 50, damping: 20, mass: 0.8 });
  const y = useSpring(target.y, { stiffness: 50, damping: 20, mass: 0.8 });

  function onPointerMove(event: React.PointerEvent<HTMLElement>) {
    if (reduce || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    target.x.set(event.clientX - rect.left - rect.width / 2);
    target.y.set(event.clientY - rect.top - rect.height / 2);
  }

  function onPointerLeave() {
    target.x.set(0);
    target.y.set(0);
  }

  return (
    <section
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className="relative isolate overflow-hidden"
    >
      <motion.div
        aria-hidden="true"
        className="-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute top-1/2 left-1/2 z-0 rounded-full bg-accent blur-[120px]"
        style={{ width: GLOW_SIZE, height: GLOW_SIZE, x, y }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.45 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-4rem)] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
        {children}
      </div>
    </section>
  );
}
