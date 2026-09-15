"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { Icon } from "../../icons";
import { cn } from "../../lib/utils";
import { Button } from "../button";
import {
  type ChapterPalette,
  POYNT_CHAPTER_PALETTE,
} from "../marketing/chapter-rotator";
import { SectionHeader } from "../section-header";
import { VekstFooterLink, type VekstLink } from "./growth-calculator";
import { countYes, weakestIndex, zoneForYes } from "./logic";
import { ZONE_BG, ZONE_LABELS, vekstVars } from "./palette";

export interface WheelArea {
  name: string;
  questions: string[];
  /** Råd som vises når dette er det svakeste området. */
  advice?: string;
  link?: VekstLink;
}

export interface ChangeWheelProps {
  eyebrow?: string;
  title?: string;
  intro?: string;
  areas: WheelArea[];
  /**
   * Prompt som kopieres sammen med resultatet. `{resultat}` byttes ut med
   * svarene; uten plassholder legges resultatet til på slutten.
   */
  aiPrompt?: string;
  palette?: ChapterPalette;
  className?: string;
}

const SIZE = 280;
const C = SIZE / 2;
const R_OUTER = 128;
const R_INNER = 30;

function polar(r: number, degrees: number): [number, number] {
  const a = (degrees * Math.PI) / 180;
  return [C + r * Math.sin(a), C - r * Math.cos(a)];
}

function sector(r: number, from: number, to: number): string {
  const large = to - from > 180 ? 1 : 0;
  const [x1, y1] = polar(r, from);
  const [x2, y2] = polar(r, to);
  const [x3, y3] = polar(R_INNER, to);
  const [x4, y4] = polar(R_INNER, from);
  const f = (n: number) => n.toFixed(2);
  return `M${f(x1)} ${f(y1)} A${r} ${r} 0 ${large} 1 ${f(x2)} ${f(y2)} L${f(x3)} ${f(y3)} A${R_INNER} ${R_INNER} 0 ${large} 0 ${f(x4)} ${f(y4)} Z`;
}

/**
 * Endringshjulet fra boka: fire områder, tre ja/nei-spørsmål hver. Hvert
 * område fylles i sin fargesone, og når alt er besvart roterer hjulet så det
 * svakeste området havner øverst: der starter du.
 */
export function ChangeWheel({
  eyebrow,
  title,
  intro,
  areas,
  aiPrompt,
  palette = POYNT_CHAPTER_PALETTE,
  className,
}: ChangeWheelProps) {
  const reduceMotion = useReducedMotion();
  const emptyAnswers = () =>
    areas.map((area) => area.questions.map((): boolean | null => null));
  const [answers, setAnswers] = useState(emptyAnswers);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  if (areas.length < 2) return null;

  const scores = areas.map((area, i) => ({
    yes: countYes(answers[i] ?? []),
    total: area.questions.length,
  }));
  const complete = answers.map((row) => row.every((a) => a !== null));
  const answered = answers.flat().filter((a) => a !== null).length;
  const totalQuestions = answers.flat().length;
  const allComplete = complete.every(Boolean);
  const weakest = allComplete ? weakestIndex(scores) : -1;

  const span = 360 / areas.length;
  const gap = areas.length > 2 ? 1.5 : 0.75;
  const rotation = weakest >= 0 ? -(weakest * span + span / 2) : 0;
  const turn = reduceMotion
    ? "none"
    : "transform 1100ms cubic-bezier(0.22, 1, 0.36, 1)";

  function answer(areaIndex: number, questionIndex: number, value: boolean) {
    setAnswers((rows) =>
      rows.map((row, i) =>
        i === areaIndex
          ? row.map((a, j) => (j === questionIndex ? value : a))
          : row
      )
    );
  }

  async function copyToAi() {
    const lines = areas
      .map((area, i) => {
        const zone = zoneForYes(scores[i].yes, scores[i].total);
        return `- ${area.name}: ${scores[i].yes} av ${scores[i].total} ja (${ZONE_LABELS[zone].toLowerCase()})`;
      })
      .join("\n");
    const prompt = aiPrompt ?? "";
    const text = prompt.includes("{resultat}")
      ? prompt.replace("{resultat}", lines)
      : `${prompt}${prompt ? "\n\n" : ""}${lines}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const weakArea = weakest >= 0 ? areas[weakest] : null;
  const weakZone =
    weakest >= 0
      ? zoneForYes(scores[weakest].yes, scores[weakest].total)
      : null;

  return (
    <div style={vekstVars(palette)} className={className}>
      <SectionHeader eyebrow={eyebrow} title={title} intro={intro} />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="flex flex-col items-center gap-5 rounded-3xl bg-card p-5 ring-1 ring-foreground/10 md:p-8 lg:sticky lg:top-28">
          <div className="relative w-full max-w-[18rem] text-foreground">
            {/* Pila øverst peker på området hjulet har rotert fram. */}
            <svg
              aria-hidden="true"
              viewBox="0 0 20 12"
              className={cn(
                "absolute -top-3 left-1/2 w-5 -translate-x-1/2 transition-opacity duration-500",
                allComplete ? "opacity-100" : "opacity-0"
              )}
            >
              <path d="M0 0h20L10 12z" fill="currentColor" />
            </svg>
            <svg
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              role="img"
              aria-label={
                weakArea
                  ? `Endringshjulet. Svakeste område: ${weakArea.name}.`
                  : `Endringshjulet. ${answered} av ${totalQuestions} spørsmål besvart.`
              }
              className="h-auto w-full"
            >
              <g
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transformOrigin: `${C}px ${C}px`,
                  transformBox: "view-box",
                  transition: turn,
                }}
              >
                {areas.map((area, i) => {
                  const from = i * span + gap;
                  const to = (i + 1) * span - gap;
                  const done = complete[i];
                  const progress = answers[i].filter((a) => a !== null).length;
                  const zone = zoneForYes(scores[i].yes, scores[i].total);
                  const fillRadius = done
                    ? R_OUTER
                    : R_INNER +
                      (progress / Math.max(1, area.questions.length)) *
                        (R_OUTER - R_INNER);
                  const [lx, ly] = polar(
                    (R_OUTER + R_INNER) / 2,
                    i * span + span / 2
                  );
                  return (
                    <g key={area.name}>
                      <path
                        d={sector(R_OUTER, from, to)}
                        fill="var(--vk-ghost)"
                      />
                      <path
                        d={sector(fillRadius, from, to)}
                        fill={done ? `var(--vk-${zone})` : "var(--vk-surface)"}
                        fillOpacity={done ? 1 : 0.45}
                        stroke={i === weakest ? "currentColor" : "none"}
                        strokeWidth={3}
                        style={{ transition: "fill 300ms" }}
                      />
                      <g
                        style={{
                          transform: `rotate(${-rotation}deg)`,
                          transformOrigin: `${lx}px ${ly}px`,
                          transformBox: "view-box",
                          transition: turn,
                        }}
                      >
                        <circle
                          cx={lx}
                          cy={ly}
                          r={15}
                          fill="var(--color-card, #fff)"
                        />
                        <text
                          x={lx}
                          y={ly + 5}
                          textAnchor="middle"
                          fontSize={15}
                          fontWeight={700}
                          fill="currentColor"
                        >
                          {i + 1}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>

          {weakArea && weakZone ? (
            <div aria-live="polite" className="flex w-full flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground text-sm uppercase tracking-[0.2em]">
                  Start med
                </span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 font-heading font-semibold text-foreground text-xs",
                    ZONE_BG[weakZone]
                  )}
                >
                  {scores[weakest].yes} av {scores[weakest].total} ja
                </span>
              </div>
              <p className="font-bold font-heading text-2xl leading-tight">
                {weakArea.name}
              </p>
              {weakArea.advice && (
                <p className="text-muted-foreground leading-relaxed">
                  {weakArea.advice}
                </p>
              )}
              {weakArea.link && <VekstFooterLink link={weakArea.link} />}
              <div className="mt-2 flex flex-wrap gap-2">
                {aiPrompt !== undefined && (
                  <Button
                    type="button"
                    onClick={copyToAi}
                    className="rounded-full"
                  >
                    <Icon
                      name={copied ? "check" : "copy"}
                      className="mr-2 size-4"
                    />
                    {copied ? "Kopiert" : "Kopier resultatet til KI"}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => setAnswers(emptyAnswers())}
                >
                  Start på nytt
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex w-full flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span>Svar på spørsmålene</span>
                <span className="tabular-nums text-muted-foreground">
                  {answered} av {totalQuestions}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--vk-ghost)]">
                <div
                  className="h-full rounded-full bg-[var(--vk-surface)] transition-[width] duration-500"
                  style={{
                    width: `${(answered / Math.max(1, totalQuestions)) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <ol className="flex flex-col gap-4">
          {areas.map((area, i) => {
            const zone = zoneForYes(scores[i].yes, scores[i].total);
            return (
              <li
                key={area.name}
                className={cn(
                  "rounded-3xl bg-card p-5 ring-1 ring-foreground/10 transition-shadow md:p-6",
                  i === weakest && "shadow-md ring-2 ring-foreground"
                )}
              >
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <span className="grid size-8 place-items-center rounded-full bg-[var(--vk-ghost)] font-bold font-heading text-sm">
                    {i + 1}
                  </span>
                  <h3 className="font-bold font-heading text-lg leading-snug">
                    {area.name}
                  </h3>
                  {complete[i] && (
                    <span
                      className={cn(
                        "ml-auto rounded-full px-2.5 py-1 font-heading font-semibold text-foreground text-xs",
                        ZONE_BG[zone]
                      )}
                    >
                      {ZONE_LABELS[zone]}
                    </span>
                  )}
                </div>
                <ul className="flex flex-col divide-y divide-foreground/10">
                  {area.questions.map((question, j) => (
                    <li
                      key={question}
                      className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                    >
                      <span className="leading-snug">{question}</span>
                      <span className="flex shrink-0 gap-1.5">
                        {(
                          [
                            [true, "Ja"],
                            [false, "Nei"],
                          ] as const
                        ).map(([value, label]) => {
                          const selected = answers[i][j] === value;
                          return (
                            <button
                              key={label}
                              type="button"
                              aria-pressed={selected}
                              aria-label={`${label}: ${question}`}
                              onClick={() => answer(i, j, value)}
                              className={cn(
                                "min-w-14 rounded-full px-4 py-1.5 font-heading font-semibold text-sm ring-1 ring-foreground/15 transition-colors",
                                selected
                                  ? "bg-foreground text-background ring-foreground"
                                  : "hover:bg-muted"
                              )}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
