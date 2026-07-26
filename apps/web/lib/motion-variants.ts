import { duration, easeSoft, revealRise } from "@poynt/ui/motion";

/** Stegbytte i verktøy-flytene (intro → skjema → resultat). Rask inn, raskere ut. */
export const stepFade = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.fast, ease: easeSoft },
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.15, ease: easeSoft } },
} as const;

/** Seksjons-reveal i resultatvisninger — samme grammatikk som <Reveal>. */
export const sectionReveal = {
  initial: { opacity: 0, y: revealRise },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: easeSoft },
} as const;

export const containerMotionVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
};

export const itemMotionVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    },
  },
};

export const headerMotionVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    },
  },
};
