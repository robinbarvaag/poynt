"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { cn } from "../../lib/utils";
import { Button } from "../button";
import { ConfettiBurst } from "../event/confetti-burst";
import {
  type ChapterPalette,
  POYNT_CHAPTER_PALETTE,
} from "../marketing/chapter-rotator";
import { SectionHeader } from "../section-header";
import { VekstFooterLink, type VekstLink } from "./growth-calculator";
import { strongestIndex, weakestIndex } from "./logic";
import { vekstVars } from "./palette";

export interface VekstPillar {
  /** Bokstaven på klossen. Default: første bokstav i navnet. */
  letter?: string;
  name: string;
  questions: string[];
  /** Råd når denne pilaren er svakest. */
  advice?: string;
  link?: VekstLink;
}

export interface VekstCheckProps {
  eyebrow?: string;
  title?: string;
  intro?: string;
  pillars: VekstPillar[];
  palette?: ChapterPalette;
  className?: string;
}

const letterOf = (pillar: VekstPillar) =>
  (pillar.letter?.trim() || pillar.name.trim().charAt(0)).toUpperCase();

/**
 * VEKST-sjekken: ett ja/nei-spørsmål om gangen. Bokstavklossene fylles opp
 * med bokfarge for hvert ja, og til slutt løftes den sterkeste bokstaven fram
 * mens den svakeste får et forslag om hvor du bør starte.
 */
export function VekstCheck({
  eyebrow,
  title,
  intro,
  pillars,
  palette = POYNT_CHAPTER_PALETTE,
  className,
}: VekstCheckProps) {
  const reduceMotion = useReducedMotion();
  const flat = pillars.flatMap((pillar, p) =>
    pillar.questions.map((question, q) => ({ p, q, question }))
  );
  const [answers, setAnswers] = useState<(boolean | null)[]>(() =>
    flat.map(() => null)
  );
  const [index, setIndex] = useState(0);

  if (flat.length === 0) return null;

  const done = index >= flat.length;
  const scores = pillars.map((pillar, p) => ({
    yes: flat.filter((item, k) => item.p === p && answers[k] === true).length,
    total: pillar.questions.length,
  }));
  const strongest = done ? strongestIndex(scores) : -1;
  const weakest = done ? weakestIndex(scores) : -1;
  const allYes = done && scores.every((s) => s.yes === s.total);
  const allEqual =
    done &&
    scores.every((s) => s.yes / s.total === scores[0].yes / scores[0].total);
  const current = done ? null : flat[index];

  function reply(value: boolean) {
    setAnswers((a) => a.map((old, k) => (k === index ? value : old)));
    setIndex((i) => i + 1);
  }

  function restart() {
    setAnswers(flat.map(() => null));
    setIndex(0);
  }

  const slide = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, x: 24 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -24 },
      };

  return (
    <div style={vekstVars(palette)} className={className}>
      <SectionHeader eyebrow={eyebrow} title={title} intro={intro} />

      <div className="relative flex flex-col gap-8 overflow-hidden rounded-3xl bg-card p-5 ring-1 ring-foreground/10 md:p-10">
        {allYes && <ConfettiBurst />}

        <ol
          className="grid gap-2 sm:gap-4"
          style={{
            gridTemplateColumns: `repeat(${pillars.length}, minmax(0, 1fr))`,
          }}
          aria-label="Bokstavene i VEKST"
        >
          {pillars.map((pillar, p) => {
            const fill = (scores[p].yes / Math.max(1, scores[p].total)) * 100;
            const letter = letterOf(pillar);
            const active = current?.p === p;
            const lifted = p === strongest && !allEqual;
            return (
              <li
                key={pillar.name}
                className="flex flex-col items-center gap-2"
              >
                <motion.div
                  animate={{ y: lifted && !reduceMotion ? -12 : 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                  className={cn(
                    "relative grid aspect-[3/4] w-full max-w-24 place-items-center overflow-hidden rounded-2xl bg-card ring-2 ring-foreground/80 transition-shadow",
                    active && "ring-[3px] ring-offset-2 ring-offset-card",
                    lifted && "shadow-[0_12px_0_-4px_var(--vk-accent)]"
                  )}
                >
                  <span className="font-extrabold font-heading text-4xl text-foreground sm:text-6xl">
                    {letter}
                  </span>
                  {/* Samme bokstav i bokfarge, klippet nedenfra: «glasset» fylles. */}
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 grid place-items-center bg-[var(--vk-surface)] font-extrabold font-heading text-4xl text-[var(--vk-ink)] transition-[clip-path] duration-700 ease-out motion-reduce:transition-none sm:text-6xl"
                    style={{ clipPath: `inset(${100 - fill}% 0 0 0)` }}
                  >
                    {letter}
                  </span>
                </motion.div>
                <span
                  className={cn(
                    "text-center text-xs leading-tight sm:text-sm",
                    p === weakest && !allEqual
                      ? "font-heading font-semibold"
                      : "text-muted-foreground"
                  )}
                >
                  {pillar.name}
                </span>
              </li>
            );
          })}
        </ol>

        <div className="min-h-44" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            {current ? (
              <motion.div
                key={index}
                {...slide}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-muted-foreground text-sm">
                  <span className="uppercase tracking-[0.2em]">
                    {letterOf(pillars[current.p])} · {pillars[current.p].name}
                  </span>
                  <span className="tabular-nums">
                    {index + 1} av {flat.length}
                  </span>
                </div>
                <p className="max-w-2xl text-balance font-bold font-heading text-2xl leading-snug md:text-3xl">
                  {current.question}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => reply(true)}
                    className="min-w-24 rounded-full"
                  >
                    Ja
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => reply(false)}
                    className="rounded-full"
                  >
                    Ikke ennå
                  </Button>
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIndex((i) => i - 1)}
                      className="ml-auto rounded-full"
                    >
                      Tilbake
                    </Button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="resultat"
                {...slide}
                className="flex flex-col gap-4"
              >
                <p className="max-w-2xl text-balance font-bold font-heading text-2xl leading-snug md:text-3xl">
                  {allYes
                    ? "Alle fem bokstavene er fylt opp. Sterkt!"
                    : allEqual
                      ? "Du står likt på alle områdene."
                      : `Du er sterkest på ${pillars[strongest].name}. Start med ${pillars[weakest].name}.`}
                </p>
                {!allYes && weakest >= 0 && pillars[weakest].advice && (
                  <p className="max-w-2xl text-muted-foreground leading-relaxed">
                    {pillars[weakest].advice}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                  {!allYes && weakest >= 0 && pillars[weakest].link && (
                    <VekstFooterLink
                      link={pillars[weakest].link as VekstLink}
                    />
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={restart}
                    className="rounded-full"
                  >
                    Ta sjekken på nytt
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
