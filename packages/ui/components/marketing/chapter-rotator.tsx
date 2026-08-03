"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "../../lib/utils";
import { duration, easeSoft } from "../motion/motion-tokens";
import { useTilt } from "../motion/use-tilt";

export interface Chapter {
  /** Kapittelnavnet. Første bokstav blir den store bokstaven på kortet. */
  title: string;
  /** Én setning om hva kapittelet handler om. */
  text?: string;
}

/**
 * Fargene på kortet. Enhver gyldig CSS-fargeverdi går (hex, `var(--…)`,
 * `color-mix(…)`), så et produkt med egen identitet kan låne kortet uten at
 * fargene sniker seg inn i Poynt-paletten.
 */
export interface ChapterPalette {
  /** Kortets flate. */
  surface: string;
  /** Tekstfarge på flaten. */
  ink: string;
  /** Dempet tekst (brødtekst, etikett). */
  inkSoft: string;
  /** Nesten-usynlig: den store bokstaven bak og de inaktive brikkene. */
  ghost: string;
  /** Flaten på den aktive bokstav-brikka. */
  accent: string;
  /** Tekstfarge oppå `accent`. */
  accentInk: string;
}

export interface ChapterRotatorProps {
  chapters: Chapter[];
  /** Liten etikett øverst på kortet. */
  eyebrow?: string;
  /** Farger. Uten dette brukes Poynt-grønt. */
  palette?: ChapterPalette;
  /** Millisekunder per kapittel. Default 4000. */
  intervalMs?: number;
  className?: string;
}

const POYNT_PALETTE: ChapterPalette = {
  surface: "var(--color-primary)",
  ink: "var(--color-primary-foreground)",
  inkSoft:
    "color-mix(in oklab, var(--color-primary-foreground) 78%, transparent)",
  ghost:
    "color-mix(in oklab, var(--color-primary-foreground) 12%, transparent)",
  accent: "var(--color-accent-1)",
  accentInk: "var(--color-foreground)",
};

/** Første bokstav i kapittelnavnet — akrostikonet stavet av titlene selv. */
const initialOf = (title: string) => title.trim().charAt(0).toUpperCase();

/**
 * Kortet som står der bokomslaget skal stå til boka finnes: kapitlene byttes
 * ett om gangen, og forbokstavene under staver ut boktittelen etter hvert som
 * de lyser opp. Det er ærlig (kapitlene finnes, omslaget gjør ikke det) og det
 * er innhold, ikke pynt — det forteller faktisk hva boka handler om.
 *
 * Bevegelse: rask kryss-fade med en liten blur-bro, så øyet leser ÉN
 * forvandling i stedet for to kort som byttes. Pauser når pekeren hviler på
 * kortet, og lar deg hoppe til et kapittel ved å klikke en bokstav.
 * `prefers-reduced-motion` gir ren fade uten forskyvning eller vipp.
 */
export function ChapterRotator({
  chapters,
  eyebrow = "Kapitlene i boka",
  palette = POYNT_PALETTE,
  intervalMs = 4000,
  className,
}: ChapterRotatorProps) {
  const reduce = useReducedMotion();
  const { transform, glare, handlers } = useTilt({ max: 9 });
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback(
    (next: number) =>
      setIndex(((next % chapters.length) + chapters.length) % chapters.length),
    [chapters.length]
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: `index` MÅ stå her — den restarter timeren etter hvert bytte, også når du klikker en bokstav. Uten den fyrer den bare én gang.
  useEffect(() => {
    if (paused || chapters.length < 2) return;
    const timer = setTimeout(
      () => setIndex((i) => (i + 1) % chapters.length),
      intervalMs
    );
    return () => clearTimeout(timer);
  }, [index, paused, intervalMs, chapters.length]);

  if (chapters.length === 0) return null;
  const current = chapters[index];

  const vars = {
    "--chapter-surface": palette.surface,
    "--chapter-ink": palette.ink,
    "--chapter-ink-soft": palette.inkSoft,
    "--chapter-ghost": palette.ghost,
    "--chapter-accent": palette.accent,
    "--chapter-accent-ink": palette.accentInk,
  } as CSSProperties;

  return (
    <div
      className={cn("[perspective:1600px]", className)}
      style={vars}
      {...handlers}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => {
        setPaused(false);
        handlers.onPointerLeave();
      }}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <motion.div
        style={{ transform }}
        className="relative flex aspect-[2/3] flex-col justify-between overflow-hidden rounded-3xl bg-[var(--chapter-surface)] p-7 text-[var(--chapter-ink)] shadow-2xl ring-1 ring-foreground/10 md:p-9"
      >
        {/* Den store forbokstaven som bakgrunn — leses som bokdesign, ikke
            som en dekorativ flate. */}
        <span
          aria-hidden="true"
          className="-bottom-10 -right-6 pointer-events-none absolute select-none font-bold font-heading text-[14rem] text-[var(--chapter-ghost)] leading-none"
        >
          {initialOf(current.title)}
        </span>

        <span className="relative z-10 font-medium text-[var(--chapter-ink-soft)] text-xs uppercase tracking-[0.2em]">
          {eyebrow}
        </span>

        {/* Teksten sentreres i kortet — med korte kapittelnavn ville den ellers
            klamre seg til toppen og etterlate et hull midt på. */}
        <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-center py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.title}
              initial={
                reduce
                  ? { opacity: 0 }
                  : { opacity: 0, y: 10, filter: "blur(4px)" }
              }
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={
                reduce
                  ? { opacity: 0 }
                  : { opacity: 0, y: -8, filter: "blur(4px)" }
              }
              transition={{ duration: duration.fast, ease: easeSoft }}
            >
              <p className="text-balance font-bold font-heading text-3xl leading-[1.1] tracking-tight md:text-4xl">
                {current.title}
              </p>
              {current.text && (
                <p className="mt-4 text-pretty text-[var(--chapter-ink-soft)] leading-relaxed">
                  {current.text}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Forbokstavene: både framdriftsindikator og selve poenget — de
            staver ut boktittelen. */}
        <div className="relative z-10 flex gap-2">
          {chapters.map((chapter, i) => (
            <button
              key={chapter.title}
              type="button"
              onClick={() => go(i)}
              aria-label={`Vis kapittelet ${chapter.title}`}
              aria-current={i === index}
              className={cn(
                "pressable flex size-9 items-center justify-center rounded-xl font-bold font-heading text-sm transition-colors duration-200",
                i === index
                  ? "bg-[var(--chapter-accent)] text-[var(--chapter-accent-ink)]"
                  : "bg-[var(--chapter-ghost)] text-[var(--chapter-ink-soft)]"
              )}
            >
              {initialOf(chapter.title)}
            </button>
          ))}
        </div>

        <motion.div
          aria-hidden="true"
          style={{ backgroundImage: glare }}
          className="pointer-events-none absolute inset-0 mix-blend-soft-light"
        />
      </motion.div>
    </div>
  );
}
