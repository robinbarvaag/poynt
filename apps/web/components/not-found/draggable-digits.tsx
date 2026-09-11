"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useRef } from "react";

const digits = [
  { char: "4", className: "text-primary", tilt: -4 },
  {
    char: "0",
    // Hul «0» — en pen liten omvei fra de solide naboene.
    className:
      "text-transparent [-webkit-text-stroke:0.06em_var(--primary)] sm:[-webkit-text-stroke:0.05em_var(--primary)]",
    tilt: 3,
  },
  { char: "4", className: "text-primary", tilt: 5 },
] as const;

/**
 * Det store 404-tallet. Hvert siffer kan dras rundt (og kastes — de sklir
 * med momentum), så de faktisk oppfører seg som ting som har stukket av.
 * Med prefers-reduced-motion er de bare et statisk tall.
 */
export function DraggableDigits() {
  const reduce = useReducedMotion();
  const boundsRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={boundsRef}
      className="relative flex items-center justify-center font-heading font-extrabold text-[clamp(7rem,26vw,18rem)] leading-[0.85] tracking-tighter"
      aria-label="404"
    >
      {digits.map((digit, i) => (
        <motion.span
          key={`${digit.char}-${i.toString()}`}
          aria-hidden="true"
          className={`inline-block cursor-grab select-none active:cursor-grabbing ${digit.className}`}
          drag={!reduce}
          dragConstraints={boundsRef}
          dragElastic={0.6}
          dragMomentum
          dragTransition={{ power: 0.3, timeConstant: 180 }}
          whileHover={reduce ? undefined : { scale: 1.06, rotate: digit.tilt }}
          whileDrag={{ scale: 1.1, rotate: digit.tilt * 2, zIndex: 20 }}
          initial={{ opacity: 0, y: 40, rotate: digit.tilt * 3 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{
            delay: 0.1 + i * 0.09,
            type: "spring",
            stiffness: 160,
            damping: 14,
          }}
        >
          {digit.char}
        </motion.span>
      ))}
    </div>
  );
}
