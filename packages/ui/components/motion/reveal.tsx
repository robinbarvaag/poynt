"use client";

import { type HTMLMotionProps, motion } from "framer-motion";

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
 * Scroll-reveal er DEAKTIVERT (2026-08-24): innholdet lå server-rendret med
 * opacity 0 til hydrering, så på treg last «poppet» det sent inn i stedet for
 * å animere — det føltes tregt og hakkete. Komponentene beholder API-et sitt
 * og rendrer nå innholdet statisk, synlig fra første paint. Historikken har
 * den gamle implementasjonen om vi vil prøve igjen (da helst CSS-basert, uten
 * hydrerings-avhengighet).
 */
export function Reveal({
  delay: _delay,
  rise: _rise,
  once: _once,
  children,
  ...props
}: RevealProps) {
  return <motion.div {...props}>{children}</motion.div>;
}

interface StaggerProps extends DivMotionProps {
  /** Forskyvning mellom barn (sekunder). Default 0.07. */
  step?: number;
  once?: boolean;
}

/** Container som staggrer sine `StaggerItem`-barn inn etter hvert. */
export function Stagger({
  step: _step,
  once: _once,
  children,
  ...props
}: StaggerProps) {
  return <motion.div {...props}>{children}</motion.div>;
}

interface StaggerItemProps extends DivMotionProps {
  rise?: number;
}

/** Et barn i en `Stagger`. */
export function StaggerItem({
  rise: _rise,
  children,
  ...props
}: StaggerItemProps) {
  return <motion.div {...props}>{children}</motion.div>;
}
