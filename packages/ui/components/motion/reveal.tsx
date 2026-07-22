"use client";

import { type HTMLMotionProps, motion, useReducedMotion } from "framer-motion";
import {
  duration,
  easeSoft,
  revealRise,
  revealViewport,
  staggerStep,
} from "./motion-tokens";

type DivMotionProps = HTMLMotionProps<"div">;

interface RevealProps extends DivMotionProps {
  /** Forsinkelse før reveal (sekunder). */
  delay?: number;
  /** Hvor langt elementet glir inn (px). Default 16. */
  rise?: number;
  /** Trigg kun én gang. Default true. */
  once?: boolean;
}

/**
 * Fader + glir inn når elementet kommer i viewport. Den primære reveal-en —
 * samme varighet og easing overalt. Respekterer prefers-reduced-motion.
 */
export function Reveal({
  delay = 0,
  rise = revealRise,
  once = true,
  children,
  ...props
}: RevealProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: rise }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, ...revealViewport }}
      transition={{ duration: duration.base, ease: easeSoft, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface StaggerProps extends DivMotionProps {
  /** Forskyvning mellom barn (sekunder). Default 0.07. */
  step?: number;
  once?: boolean;
}

/** Container som staggrer sine `StaggerItem`-barn inn etter hvert. */
export function Stagger({
  step = staggerStep,
  once = true,
  children,
  ...props
}: StaggerProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, ...revealViewport }}
      variants={{ visible: { transition: { staggerChildren: step } } }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface StaggerItemProps extends DivMotionProps {
  rise?: number;
}

/** Et barn i en `Stagger`. */
export function StaggerItem({
  rise = revealRise,
  children,
  ...props
}: StaggerItemProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      variants={{
        hidden: reduce ? { opacity: 0 } : { opacity: 0, y: rise },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: duration.base, ease: easeSoft },
        },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
