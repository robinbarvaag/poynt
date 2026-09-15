"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { Icon } from "../../icons";
import { cn } from "../../lib/utils";
import { Button } from "../button";
import {
  type ChapterPalette,
  POYNT_CHAPTER_PALETTE,
} from "../marketing/chapter-rotator";
import { easeSoft } from "../motion/motion-tokens";
import { SectionHeader } from "../section-header";
import { isoWeekKey } from "./logic";
import { vekstVars } from "./palette";
import { Stamp } from "./stamp";
import { useStoredState } from "./use-stored-state";

export interface SalesRitualProps {
  eyebrow?: string;
  title?: string;
  intro?: string;
  /** Navnet på økta, f.eks. «Omsetnings-onsdag». */
  ritualName: string;
  /** «onsdag» */
  weekdayLabel: string;
  /** «ONS» */
  weekdayShort: string;
  startTime: string;
  endTime: string;
  checklist: string[];
  /** Sitat eller påminnelse over sjekklista. */
  quote?: string;
  /** Lenke til kalenderfila (.ics). */
  calendarHref?: string;
  palette?: ChapterPalette;
  className?: string;
}

function ProgressRing({ value, total }: { value: number; total: number }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const share = total > 0 ? value / total : 0;
  return (
    <svg viewBox="0 0 80 80" className="size-24" aria-hidden="true">
      <circle
        cx={40}
        cy={40}
        r={radius}
        fill="none"
        stroke="var(--vk-ghost)"
        strokeWidth={8}
      />
      <circle
        cx={40}
        cy={40}
        r={radius}
        fill="none"
        stroke="var(--vk-surface)"
        strokeWidth={8}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - share)}
        transform="rotate(-90 40 40)"
        style={{ transition: "stroke-dashoffset 500ms ease-out" }}
      />
      <text
        x={40}
        y={46}
        textAnchor="middle"
        fontSize={18}
        fontWeight={700}
        fill="currentColor"
      >
        {value}/{total}
      </text>
    </svg>
  );
}

/**
 * Omsetnings-onsdag: en fast salgsøkt i uka. Kalenderbladet rives av når økta
 * starter, sjekklista huskes i nettleseren og nullstilles hver uke, og økta kan
 * legges rett i kalenderen som en gjentakende avtale.
 */
export function SalesRitual({
  eyebrow,
  title,
  intro,
  ritualName,
  weekdayLabel,
  weekdayShort,
  startTime,
  endTime,
  checklist,
  quote,
  calendarHref,
  palette = POYNT_CHAPTER_PALETTE,
  className,
}: SalesRitualProps) {
  const reduceMotion = useReducedMotion();
  const [week, setWeek] = useState<string | null>(null);
  const [torn, setTorn] = useState(false);

  // Uka er bare kjent på klienten; lagring venter til den er satt.
  useEffect(() => setWeek(isoWeekKey(new Date())), []);

  const [done, setDone] = useStoredState<boolean[]>(
    week ? `vekst-okt:${ritualName}:${week}` : null,
    checklist.map(() => false),
    (raw) =>
      Array.isArray(raw) && raw.length === checklist.length
        ? raw.map(Boolean)
        : null
  );

  const doneCount = done.filter(Boolean).length;
  const allDone = checklist.length > 0 && doneCount === checklist.length;

  return (
    <div style={vekstVars(palette)} className={className}>
      <SectionHeader eyebrow={eyebrow} title={title} intro={intro} />

      <div className="grid gap-8 rounded-3xl bg-card p-5 ring-1 ring-foreground/10 md:grid-cols-[15rem_minmax(0,1fr)] md:gap-10 md:p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-full max-w-60 perspective-[900px]">
            <div
              aria-hidden="true"
              className="absolute inset-x-3 -bottom-2 h-full rounded-2xl bg-[var(--vk-ghost)]"
            />
            <div className="relative flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-2xl bg-background p-4 text-center ring-1 ring-foreground/10">
              <ProgressRing value={doneCount} total={checklist.length} />
              <p className="font-heading font-semibold">
                {allDone ? "Uka er i boks" : "Økta er i gang"}
              </p>
              <p className="text-muted-foreground text-sm">
                {startTime}–{endTime}
              </p>
            </div>
            <motion.div
              className="absolute inset-0 flex origin-top flex-col overflow-hidden rounded-2xl bg-card shadow-md ring-1 ring-foreground/10"
              initial={false}
              animate={
                torn
                  ? { rotateX: -100, y: 24, opacity: 0 }
                  : { rotateX: 0, y: 0, opacity: 1 }
              }
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 0.7, ease: easeSoft }
              }
              style={{ pointerEvents: torn ? "none" : "auto" }}
              aria-hidden={torn}
            >
              <div className="bg-[#c8354f] py-2.5 text-center font-heading font-semibold text-white text-xs uppercase tracking-[0.3em]">
                {weekdayLabel}
              </div>
              <div
                aria-hidden="true"
                className="border-foreground/15 border-b-2 border-dashed"
              />
              <div className="flex flex-1 flex-col items-center justify-center gap-1 p-4 text-center">
                <span className="font-extrabold font-heading text-6xl leading-none tracking-tight">
                  {weekdayShort}
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {startTime}–{endTime}
                </span>
                <span className="mt-2 font-heading font-semibold">
                  {ritualName}
                </span>
              </div>
            </motion.div>
          </div>
          <Button
            type="button"
            onClick={() => setTorn((t) => !t)}
            className="mt-2 rounded-full"
            variant={torn ? "outline" : "default"}
          >
            {torn ? "Legg på et nytt ark" : "Start økta"}
          </Button>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          {quote && (
            <blockquote className="rounded-2xl bg-[var(--vk-surface)] p-5 text-[var(--vk-ink)] leading-relaxed">
              {quote}
            </blockquote>
          )}

          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold font-heading text-lg">
              Sjekkliste for økta
            </h3>
            {allDone && <Stamp tone="good">I boks</Stamp>}
          </div>
          <ul className="flex flex-col gap-2">
            {checklist.map((item, i) => (
              <li key={item}>
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl p-3 ring-1 ring-foreground/10 transition-colors hover:bg-muted/40 has-checked:bg-[var(--vk-ghost)]">
                  <input
                    type="checkbox"
                    checked={done[i] ?? false}
                    onChange={() =>
                      setDone((d) => d.map((v, k) => (k === i ? !v : v)))
                    }
                    className="mt-0.5 size-5 shrink-0 accent-[var(--vk-surface)]"
                  />
                  <span
                    className={cn(
                      "leading-snug",
                      done[i] && "text-muted-foreground line-through"
                    )}
                  >
                    {item}
                  </span>
                </label>
              </li>
            ))}
          </ul>

          <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-3">
            {calendarHref && (
              <Button asChild className="rounded-full">
                <a href={calendarHref} download>
                  <Icon name="calendar-days" className="mr-2 size-4" />
                  Legg i kalenderen hver {weekdayLabel}
                </a>
              </Button>
            )}
            <p className="text-muted-foreground text-xs">
              Hakene huskes i nettleseren din og nullstilles hver uke.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
