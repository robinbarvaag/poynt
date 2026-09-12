"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { Icon, type IconName } from "../../icons";
import { cn } from "../../lib/utils";
import { useTilt } from "../motion/use-tilt";

// Formene kanten «puster» mellom. Samme antall verdier i hver streng, så
// framer-motion kan interpolere dem jevnt. Holdt nær hverandre — det skal
// ligne en levende overflate, ikke en lavalampe.
const BLOB_SHAPES = [
  "60% 40% 42% 58% / 55% 45% 55% 45%",
  "52% 48% 38% 62% / 50% 52% 48% 50%",
  "64% 36% 48% 52% / 58% 42% 58% 42%",
  "56% 44% 40% 60% / 52% 48% 50% 50%",
  "60% 40% 42% 58% / 55% 45% 55% 45%",
];

const PILL_POSITIONS = [
  "-left-3 top-8 lg:-left-4 lg:top-12",
  "top-1/3 -right-3 lg:right-0",
  "bottom-6 left-2 lg:bottom-10 lg:left-6",
];

export interface HeroPortraitPill {
  label: string;
  icon?: IconName;
}

interface HeroPortraitProps {
  children: ReactNode;
  duotone?: boolean;
  pills?: HeroPortraitPill[];
}

/**
 * Heroens foto: organisk form der kanten langsomt morfer, bildet driver
 * svakt (Ken Burns) og hele objektet vipper i 3D mot pekeren. Pillene ligger
 * foran bildet i Z-aksen, så de får parallax når det vipper. Alt står stille
 * ved prefers-reduced-motion; på berøring er det kun «pusten» som går.
 */
export function HeroPortrait({
  children,
  duotone = true,
  pills,
}: HeroPortraitProps) {
  const reduce = useReducedMotion();
  const { transform, glare, handlers } = useTilt({ max: 7 });

  return (
    <motion.div
      {...handlers}
      style={{ transform, transformStyle: "preserve-3d" }}
      className="relative"
    >
      <motion.div
        className="relative isolate aspect-4/5 w-full overflow-hidden shadow-xl ring-1 ring-foreground/10"
        style={{ borderRadius: BLOB_SHAPES[0] }}
        animate={reduce ? undefined : { borderRadius: BLOB_SHAPES }}
        transition={{
          duration: 14,
          ease: "easeInOut",
          repeat: Number.POSITIVE_INFINITY,
        }}
      >
        <motion.div
          className="absolute inset-0"
          animate={
            reduce
              ? undefined
              : { scale: [1.04, 1.09, 1.04], x: [0, -6, 0], y: [0, 4, 0] }
          }
          transition={{
            duration: 20,
            ease: "easeInOut",
            repeat: Number.POSITIVE_INFINITY,
          }}
        >
          {children}
        </motion.div>
        {duotone && (
          <>
            {/* Duotone-tint i merkefarge */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-primary/30 mix-blend-multiply"
            />
            {/* Mykt fargedybde-overlegg (teal → coral) */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-linear-to-br from-primary/20 via-transparent to-accent/35 mix-blend-screen"
            />
          </>
        )}
        {/* Lysrefleks som følger pekeren */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 mix-blend-soft-light"
          style={{ backgroundImage: glare }}
        />
      </motion.div>

      {pills?.slice(0, PILL_POSITIONS.length).map((pill, index) => (
        <div
          key={pill.label}
          className={cn("absolute", PILL_POSITIONS[index])}
          style={{ transform: `translateZ(${40 + index * 15}px)` }}
        >
          <motion.div
            className="flex items-center gap-2 whitespace-nowrap rounded-full bg-card px-3 py-1.5 shadow-lg ring-1 ring-foreground/5 lg:px-4 lg:py-2"
            animate={reduce ? undefined : { y: [0, -5, 0] }}
            transition={{
              duration: 5 + index * 1.3,
              delay: index * 0.8,
              ease: "easeInOut",
              repeat: Number.POSITIVE_INFINITY,
            }}
          >
            {pill.icon && (
              <Icon name={pill.icon} className="size-4 text-primary" />
            )}
            <span className="font-medium text-card-foreground text-sm">
              {pill.label}
            </span>
          </motion.div>
        </div>
      ))}
    </motion.div>
  );
}
