"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { useTilt } from "../motion/use-tilt";
import { FIGURE_ASPECT_CLASS, type FigureAspect } from "./chapter-rotator";

export interface BookCoverProps {
  /** Selve omslaget — et bilde-element (f.eks. `<PayloadImage>`). */
  children: ReactNode;
  /** Sakte sveve-løkke. Default true. */
  float?: boolean;
  /**
   * Proporsjon. `book` (2:3) gir rygg og bokblokk; `card`/`square` dropper
   * bokdetaljene og viser bildet som et vippende kort — for produkter,
   * plakater eller et skjermbilde.
   */
  aspect?: FigureAspect;
  className?: string;
}

/**
 * Bokomslag i 3D: står lett på skrå med synlig rygg og bokblokk, og vipper
 * mot pekeren (se `useTilt`). Krever et ekte omslagsbilde — et typografisk
 * plassholder-omslag ville påstå at boka er ferdig. Finnes ikke omslaget ennå,
 * bruk `<ChapterRotator>` i stedet.
 */
export function BookCover({
  children,
  float = true,
  aspect = "book",
  className,
}: BookCoverProps) {
  const { transform, glare, handlers } = useTilt();
  const isBook = aspect === "book";

  return (
    <div className={cn("[perspective:1600px]", className)} {...handlers}>
      <div className={cn(float && "animate-book-float")}>
        <motion.div
          style={{ transform }}
          className="relative [transform-style:preserve-3d]"
        >
          {/* Bokblokken: tynne linjer som leser som sidekanter, forskjøvet bak
              omslaget slik at boka får tykkelse. */}
          {isBook && (
            <div
              aria-hidden="true"
              className="absolute inset-y-2 right-[-10px] left-3 rounded-r-lg bg-[repeating-linear-gradient(90deg,var(--color-muted)_0px,var(--color-muted)_2px,color-mix(in_oklab,var(--color-foreground)_18%,transparent)_3px)] shadow-lg"
            />
          )}

          <div
            className={cn(
              "relative overflow-hidden shadow-2xl ring-1 ring-foreground/10",
              FIGURE_ASPECT_CLASS[aspect],
              isBook ? "rounded-r-xl rounded-l" : "rounded-3xl"
            )}
          >
            {children}

            {/* Ryggen: mørk gradient + lysstripe der omslaget bretter. */}
            {isBook && (
              <>
                <div
                  aria-hidden="true"
                  className="absolute inset-y-0 left-0 w-[7%] bg-gradient-to-r from-black/35 via-black/12 to-transparent"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-y-0 left-[7%] w-px bg-white/25"
                />
              </>
            )}

            {/* Lysstripa som følger pekeren. */}
            <motion.div
              aria-hidden="true"
              style={{ backgroundImage: glare }}
              className="absolute inset-0 mix-blend-soft-light"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
