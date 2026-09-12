"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "../../icons";
import { UILink } from "../../lib/link";
import { cn } from "../../lib/utils";
import { duration, easeSoft } from "../motion/motion-tokens";
import { useTilt } from "../motion/use-tilt";

export interface Chapter {
  /** Kapittelnavnet. Første bokstav blir den store bokstaven på kortet. */
  title: string;
  /** Én setning om hva kapittelet handler om. */
  text?: string;
  /**
   * Valgfri lenke (typisk et #anker på samme side). Gjør kortet til en
   * innholdsfortegnelse som blar seg selv: «Prompter → hopp til prompter».
   */
  href?: string;
  /** Lenketekst. Default «Gå til». */
  linkLabel?: string;
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

/**
 * Brikkene nederst på kortet. `initials` er akrostikonet (forbokstavene
 * staver ut noe — V-E-K-S-T), `numbers` for en sekvens, `dots` når brikkene
 * bare skal være framdrift.
 */
export type ChapterMarkers = "initials" | "numbers" | "dots";

/** Kortets proporsjon: bok (2:3), kort (4:5) eller kvadrat. */
export type FigureAspect = "book" | "card" | "square";

export const FIGURE_ASPECT_CLASS: Record<FigureAspect, string> = {
  book: "aspect-[2/3]",
  card: "aspect-[4/5]",
  square: "aspect-square",
};

export interface ChapterRotatorProps {
  chapters: Chapter[];
  /** Liten etikett øverst på kortet. */
  eyebrow?: string;
  /** Farger. Uten dette brukes Poynt-grønt. */
  palette?: ChapterPalette;
  /** Millisekunder per kapittel. Default 4000. */
  intervalMs?: number;
  /** Brikketype nederst. Default `initials`. */
  markers?: ChapterMarkers;
  /** Proporsjon. Default `book`. */
  aspect?: FigureAspect;
  className?: string;
}

/** Poynts egne farger — brukes når kortet ikke skal låne et produkts identitet. */
export const POYNT_CHAPTER_PALETTE: ChapterPalette = {
  surface: "var(--color-primary)",
  ink: "var(--color-primary-foreground)",
  inkSoft:
    "color-mix(in oklab, var(--color-primary-foreground) 78%, transparent)",
  ghost:
    "color-mix(in oklab, var(--color-primary-foreground) 12%, transparent)",
  accent: "var(--color-accent-1)",
  accentInk: "var(--color-foreground)",
};

/**
 * Lager en full palett fra tre farger. Lar redaktøren velge flate, tekst og
 * aksent i admin uten å måtte forstå color-mix.
 */
export function chapterPaletteFrom(colors: {
  surface: string;
  ink: string;
  accent: string;
  accentInk?: string;
}): ChapterPalette {
  return {
    surface: colors.surface,
    ink: colors.ink,
    inkSoft: `color-mix(in oklab, ${colors.ink} 72%, transparent)`,
    ghost: `color-mix(in oklab, ${colors.ink} 14%, transparent)`,
    accent: colors.accent,
    accentInk: colors.accentInk ?? colors.ink,
  };
}

/** Første bokstav i kapittelnavnet — akrostikonet stavet av titlene selv. */
const initialOf = (title: string) => title.trim().charAt(0).toUpperCase();

/**
 * Kortet som står der bokomslaget skal stå til boka finnes: kapitlene byttes
 * ett om gangen, og forbokstavene under staver ut boktittelen etter hvert som
 * de lyser opp. Det er ærlig (kapitlene finnes, omslaget gjør ikke det) og det
 * er innhold, ikke pynt — det forteller faktisk hva boka handler om.
 *
 * Kortet er ikke bundet til bøker: med `markers="numbers"` er det en sekvens,
 * med `href` på hvert kapittel en innholdsfortegnelse som blar seg selv.
 *
 * Bevegelse: rask kryss-fade med en liten blur-bro, så øyet leser ÉN
 * forvandling i stedet for to kort som byttes. Pauser når pekeren hviler på
 * kortet, og lar deg hoppe til et kapittel ved å klikke en brikke.
 * `prefers-reduced-motion` gir ren fade uten forskyvning eller vipp.
 */
export function ChapterRotator({
  chapters,
  eyebrow = "Kapitlene i boka",
  palette = POYNT_CHAPTER_PALETTE,
  intervalMs = 4000,
  markers = "initials",
  aspect = "book",
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: `index` MÅ stå her — den restarter timeren etter hvert bytte, også når du klikker en brikke. Uten den fyrer den bare én gang.
  useEffect(() => {
    if (paused || chapters.length < 2) return;
    const timer = setTimeout(
      () => setIndex((i) => (i + 1) % chapters.length),
      intervalMs
    );
    return () => clearTimeout(timer);
  }, [index, paused, intervalMs, chapters.length]);

  if (chapters.length === 0) return null;
  const current = chapters[Math.min(index, chapters.length - 1)];

  const vars = {
    "--chapter-surface": palette.surface,
    "--chapter-ink": palette.ink,
    "--chapter-ink-soft": palette.inkSoft,
    "--chapter-ghost": palette.ghost,
    "--chapter-accent": palette.accent,
    "--chapter-accent-ink": palette.accentInk,
  } as CSSProperties;

  // Bakgrunnstegnet: forbokstav for akrostikon, tallet for sekvens. Prikker
  // har ikke noe tegn å vise — da står forbokstaven, som fortsatt leser som
  // bokdesign.
  const ghostGlyph =
    markers === "numbers"
      ? String(index + 1).padStart(2, "0")
      : initialOf(current.title);

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
        className={cn(
          "relative flex flex-col justify-between overflow-hidden rounded-3xl bg-[var(--chapter-surface)] p-7 text-[var(--chapter-ink)] shadow-2xl ring-1 ring-foreground/10 md:p-9",
          FIGURE_ASPECT_CLASS[aspect]
        )}
      >
        {/* Det store tegnet som bakgrunn — leses som bokdesign, ikke som en
            dekorativ flate. */}
        <span
          aria-hidden="true"
          className={cn(
            "-bottom-10 -right-6 pointer-events-none absolute select-none font-bold font-heading text-[var(--chapter-ghost)] leading-none",
            markers === "numbers" ? "text-[11rem]" : "text-[14rem]"
          )}
        >
          {ghostGlyph}
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
              {current.href && (
                <UILink
                  href={current.href}
                  className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-[var(--chapter-accent)] px-4 py-2 font-heading font-semibold text-[var(--chapter-accent-ink)] text-sm transition-transform duration-200 motion-safe:hover:translate-x-0.5"
                >
                  {current.linkLabel ?? "Gå til"}
                  <Icon name="arrow-right" className="size-4" />
                </UILink>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Brikkene: både framdriftsindikator og — for akrostikonet — selve
            poenget: de staver ut tittelen. */}
        <div className="relative z-10 flex flex-wrap gap-2">
          {chapters.map((chapter, i) => {
            const active = i === index;
            const label =
              markers === "initials"
                ? initialOf(chapter.title)
                : markers === "numbers"
                  ? String(i + 1)
                  : "";
            return (
              <button
                key={`${chapter.title}-${i}`}
                type="button"
                onClick={() => go(i)}
                aria-label={`Vis ${chapter.title}`}
                aria-current={active}
                className={cn(
                  "pressable flex items-center justify-center rounded-xl font-bold font-heading text-sm transition-[background-color,width] duration-200",
                  markers === "dots"
                    ? cn("h-2.5 rounded-full", active ? "w-7" : "w-2.5")
                    : "size-9",
                  active
                    ? "bg-[var(--chapter-accent)] text-[var(--chapter-accent-ink)]"
                    : "bg-[var(--chapter-ghost)] text-[var(--chapter-ink-soft)]"
                )}
              >
                {label}
              </button>
            );
          })}
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
