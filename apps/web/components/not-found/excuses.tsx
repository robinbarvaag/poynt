"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

/** Mulige forklaringer på hvor siden ble av. Tørt, ikke klovnete. */
const excuses = [
  "Siden tok seg en kaffe og kom aldri tilbake.",
  "Lenken ble skrevet på fredag klokka 15:58.",
  "Noen dro i feil tråd. Alt raknet.",
  "Den er på et nettmøte som skulle vart ti minutter.",
  "Sokken der er i hvert fall funnet. Siden er det ikke.",
  "Den ligger antakelig i «Diverse»-mappen. Som alt annet.",
  "Kompasset peker på forsiden. Vi stoler på kompasset.",
];

/**
 * Roterer sakte gjennom forklaringene. Med prefers-reduced-motion vises bare
 * én, uten bytte — teksten er pynt, ikke innhold, så den er aria-hidden.
 */
export function Excuses() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % excuses.length),
      3800
    );
    return () => window.clearInterval(id);
  }, [reduce]);

  return (
    <div
      aria-hidden="true"
      className="relative flex h-14 items-center justify-center overflow-hidden"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={index}
          className="max-w-md font-medium text-foreground/70 text-sm sm:text-base"
          initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -14, filter: "blur(4px)" }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {excuses[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
