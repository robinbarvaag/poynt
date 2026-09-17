"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Icon } from "../../icons";
import { cn } from "../../lib/utils";
import { Button } from "../button";
import {
  type ChapterPalette,
  POYNT_CHAPTER_PALETTE,
} from "../marketing/chapter-rotator";
import { SectionHeader } from "../section-header";
import { VekstFooterLink, type VekstLink } from "./growth-calculator";
import { countYes, ringsForYes, weakestIndex, yesForRing } from "./logic";
import { WHEEL_RINGS, vekstVars, wheelRing } from "./palette";
import { WheelChart, WheelRingSwatch } from "./wheel-chart";

export interface WheelArea {
  name: string;
  questions: string[];
  /** Hva leseren bør gjøre med dette området. Vises i planen til slutt. */
  advice?: string;
  link?: VekstLink;
  /**
   * Lenken er satt opp, men verktøyet er ikke klart ennå. Rådet vises som
   * vanlig, lenken holdes tilbake.
   */
  linkPending?: boolean;
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

/**
 * Endringshjulet fra boka: områdene som kakestykker, hvert delt i tre ringer.
 * Hvert ja tegner én ring til, utenfra og inn, så et område du er god på ender
 * grønt helt inn i midten. Leseren svarer på ett område om gangen mens hjulet
 * står synlig ved siden av (klistret øverst på mobil), og til slutt får hun en
 * prioritert liste over hva hun bør gjøre.
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
  const [step, setStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);
  const autoAdvanced = useRef(false);
  useEffect(() => {
    if (!copied) return;
    const reset = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(reset);
  }, [copied]);

  // Etter en automatisk framrykking: dra det nye området inn i synsfeltet,
  // men bare hvis det ikke allerede står der.
  useEffect(() => {
    if (!autoAdvanced.current) return;
    autoAdvanced.current = false;
    stepRefs.current[step]?.scrollIntoView({
      block: "nearest",
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }, [step, reduceMotion]);

  if (areas.length < 2) return null;

  const scores = areas.map((area, i) => ({
    yes: countYes(answers[i] ?? []),
    total: area.questions.length,
  }));
  const rings = scores.map((score) => ringsForYes(score.yes, score.total));
  const complete = answers.map((row) => row.every((a) => a !== null));
  const answered = answers.flat().filter((a) => a !== null).length;
  const totalQuestions = answers.flat().length;
  const allComplete = complete.every(Boolean);
  const weakest = allComplete ? weakestIndex(scores) : -1;
  const questionCount = areas[0].questions.length;
  const evenQuestions = areas.every(
    (area) => area.questions.length === questionCount
  );

  function goTo(index: number) {
    setStep(index);
  }

  /** Første området etter `from` som ikke er ferdig. `areas.length` = resultat. */
  function nextOpen(rows: (boolean | null)[][], from: number): number {
    for (let n = 1; n <= rows.length; n++) {
      const i = (from + n) % rows.length;
      if (!rows[i].every((a) => a !== null)) return i;
    }
    return rows.length;
  }

  function answer(areaIndex: number, questionIndex: number, value: boolean) {
    const next = answers.map((row, i) =>
      i === areaIndex
        ? row.map((a, j) => (j === questionIndex ? value : a))
        : row
    );
    setAnswers(next);

    if (step !== areaIndex) return;
    if (!next[areaIndex].every((a) => a !== null)) return;

    // Neste område åpner seg med en gang. Hjulet blir stående synlig og
    // tegner ringen ferdig der, så ingenting går tapt av å slippe taket her.
    const target = nextOpen(next, areaIndex);
    autoAdvanced.current = target < areas.length;
    setStep(target);
  }

  function restart() {
    setAnswers(emptyAnswers());
    setStep(0);
  }

  async function copyToAi() {
    const lines = areas
      .map((area, i) => {
        const ring = wheelRing(rings[i]).label.toLowerCase();
        return `- ${area.name}: ${scores[i].yes} av ${scores[i].total} ja (${ring})`;
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

  // Planen til slutt: svakeste område først, så nedover.
  const plan = areas
    .map((area, i) => ({ area, i }))
    .sort(
      (a, b) =>
        scores[a.i].yes / scores[a.i].total -
          scores[b.i].yes / scores[b.i].total || a.i - b.i
    );

  /** Fargebrikke med ringnavn og poengsum, brukt både i lista og i planen. */
  const ringChip = (i: number, withScore: boolean) => {
    const ring = wheelRing(rings[i]);
    return (
      <span
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full py-1 pr-3 pl-1 font-heading font-semibold text-foreground text-xs"
        style={{ backgroundColor: `${ring.color}` }}
      >
        <WheelRingSwatch rings={rings[i]} className="size-4" />
        {withScore ? `${scores[i].yes} av ${scores[i].total} ja` : ring.label}
      </span>
    );
  };

  const activeArea = step < areas.length ? areas[step] : null;

  return (
    <div style={vekstVars(palette)} className={className}>
      <SectionHeader eyebrow={eyebrow} title={title} intro={intro} />

      {/* Forklaringen: hva én, to og tre ja gjør med hjulet. Uten ramme, så
          den leses som en bildetekst og ikke som enda et kort. */}
      <div className="mt-1 mb-6 flex flex-col gap-x-8 gap-y-3 lg:flex-row lg:items-center">
        <p className="max-w-sm font-semibold text-sm leading-snug">
          Hvert ja tegner én ring til, fra ytterkanten og inn mot midten:
        </p>
        <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-7">
          {WHEEL_RINGS.map((ring, k) => (
            <li key={ring.label} className="flex items-center gap-2">
              <WheelRingSwatch rings={k + 1} />
              <span className="text-sm leading-snug">
                {evenQuestions && (
                  <span className="font-heading font-semibold">
                    {yesForRing(k + 1, questionCount)} ja ·{" "}
                  </span>
                )}
                <span className="text-muted-foreground">{ring.label}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Flex på mobil, rutenett på store skjermer: begge gir hjulet plass til
          å henge med nedover siden mens du svarer. */}
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-5">
        {/* Fester seg under alt som ligger fast øverst på siden: `SiteHeader`
            publiserer høyden sin som `--site-header-offset`, og brikkemenyen i
            `HubLayout` sin som `--hub-bar-offset`. Begge er 0 når de ikke er
            der (Storybook, sider uten hub), og kortet følger dem i samme tempo.
            Kortet har samme størrelse hele veien: bytter det størrelse når det
            fester seg, endrer det sidens høyde, som flytter scrollen, som
            fester/løsner det igjen – en evig løkke. */}
        <div
          className="sticky z-20 transition-[top] duration-300 ease-drawer motion-reduce:transition-none"
          style={{
            top: "calc(var(--site-header-offset, 0px) + var(--hub-bar-offset, 0px) + 0.5rem)",
          }}
        >
          <div className="flex flex-row items-center gap-4 rounded-3xl bg-card p-4 shadow-md ring-1 ring-foreground/10 lg:flex-col lg:items-stretch lg:gap-5 lg:p-6 lg:shadow-none">
            <WheelChart
              segments={areas.map((area, i) => ({
                label: area.name,
                answers: answers[i],
                rings: rings[i],
              }))}
              activeIndex={step < areas.length ? step : -1}
              focusIndex={weakest}
              label={
                allComplete && weakest >= 0
                  ? `Endringshjulet. Svakeste område: ${areas[weakest].name}.`
                  : `Endringshjulet. ${answered} av ${totalQuestions} spørsmål besvart.`
              }
              className="w-36 shrink-0 sm:w-44 lg:w-full lg:max-w-[24rem]"
            />

            <div
              aria-live="polite"
              className="flex min-w-0 flex-1 flex-col gap-2 lg:w-full lg:items-center lg:text-center"
            >
              <p className="font-semibold text-muted-foreground text-xs uppercase tracking-[0.18em]">
                {activeArea
                  ? `Steg ${step + 1} av ${areas.length}`
                  : "Start med"}
              </p>
              <p className="text-balance font-bold font-heading leading-tight lg:text-xl">
                {activeArea?.name ??
                  (weakest >= 0 ? areas[weakest].name : "Ferdig")}
              </p>
              <div className="mt-1 flex w-full flex-col gap-1.5">
                <div className="h-1.5 overflow-hidden rounded-full bg-foreground/10">
                  <div
                    className="h-full rounded-full bg-foreground transition-[width] duration-500"
                    style={{
                      width: `${(answered / Math.max(1, totalQuestions)) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-muted-foreground text-xs tabular-nums">
                  {answered} av {totalQuestions} spørsmål
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Planen: alle områdene sortert, svakeste først. */}
          {allComplete && (
            <div className="flex flex-col gap-4 rounded-3xl bg-card p-5 ring-1 ring-foreground/10 motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:animate-in motion-safe:duration-500 md:p-6">
              <h3 className="font-bold font-heading text-xl leading-tight">
                Slik står du – og her begynner du
              </h3>
              <ol className="flex flex-col divide-y divide-foreground/10">
                {plan.map(({ area, i }, rank) => (
                  <li key={area.name} className="flex flex-col gap-2 py-4">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      {rank === 0 && (
                        <span className="rounded-full bg-foreground px-2.5 py-1 font-heading font-semibold text-background text-xs">
                          Start her
                        </span>
                      )}
                      <span className="font-bold font-heading leading-snug">
                        {area.name}
                      </span>
                      {ringChip(i, true)}
                    </div>
                    {area.advice && (
                      <p className="text-muted-foreground leading-relaxed">
                        {area.advice}
                      </p>
                    )}
                    {area.link &&
                      (area.linkPending ? (
                        <p className="inline-flex items-center gap-1.5 text-muted-foreground text-sm">
                          <Icon name="clock" className="size-4" />
                          Verktøyet kommer snart.
                        </p>
                      ) : (
                        <VekstFooterLink link={area.link} />
                      ))}
                  </li>
                ))}
              </ol>
              <div className="flex flex-wrap gap-2">
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
                  onClick={restart}
                >
                  Start på nytt
                </Button>
              </div>
            </div>
          )}

          {/* Stegene. Området du er på står åpent, de andre er slått sammen. */}
          <ol className="flex flex-col gap-3">
            {areas.map((area, i) => {
              const open = i === step;
              const areaAnswered = answers[i].filter((a) => a !== null).length;
              return (
                <li
                  key={area.name}
                  ref={(node) => {
                    stepRefs.current[i] = node;
                  }}
                  className={cn(
                    // Nok luft over til at hverken headeren eller det klistrede
                    // hjulet dekker steget når det rulles fram.
                    "overflow-hidden rounded-3xl bg-card ring-1 ring-foreground/10 transition-shadow scroll-mt-[calc(var(--site-header-offset,0px)+var(--hub-bar-offset,0px)+13rem)] lg:scroll-mt-[calc(var(--site-header-offset,0px)+1.5rem)]",
                    open && "shadow-md ring-2 ring-foreground"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => goTo(open ? areas.length : i)}
                    aria-expanded={open}
                    className="flex w-full items-center gap-3 p-4 text-left md:p-5"
                  >
                    <span
                      className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-full font-bold font-heading text-sm ring-1 ring-foreground/15",
                        open
                          ? "bg-foreground text-background ring-foreground"
                          : "bg-foreground/5"
                      )}
                    >
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold font-heading leading-snug">
                        {area.name}
                      </span>
                      {!open && (
                        <span className="block text-muted-foreground text-sm">
                          {complete[i]
                            ? `${scores[i].yes} av ${scores[i].total} ja`
                            : `${areaAnswered} av ${area.questions.length} besvart`}
                        </span>
                      )}
                    </span>
                    {complete[i] && ringChip(i, false)}
                    <Icon
                      name="chevron-down"
                      aria-hidden="true"
                      className={cn(
                        "size-5 shrink-0 text-muted-foreground transition-transform",
                        open && "rotate-180"
                      )}
                    />
                  </button>

                  {/* Rutenett-trikset: raden går fra 0fr til 1fr, så høyden
                      animerer uten at vi må måle noe. Innholdet blir stående i
                      DOM-en, men `inert` holder det ute av tabb-rekkefølgen. */}
                  <div
                    className={cn(
                      "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
                      open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    )}
                  >
                    <div
                      className={cn(
                        "overflow-hidden transition-opacity duration-300 motion-reduce:transition-none",
                        open ? "opacity-100" : "opacity-0"
                      )}
                    >
                      <ul
                        inert={!open}
                        className="flex flex-col divide-y divide-foreground/10 border-foreground/10 border-t px-4 md:px-5"
                      >
                        {area.questions.map((question, j) => (
                          <li
                            key={question}
                            className="flex flex-col gap-2 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
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
                                      "min-w-16 rounded-full px-4 py-2 font-heading font-semibold text-sm ring-1 ring-foreground/15 transition-colors",
                                      selected
                                        ? "bg-foreground text-background ring-foreground"
                                        : "hover:bg-foreground/5"
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
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
