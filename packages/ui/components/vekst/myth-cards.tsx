"use client";

import { useState } from "react";
import { Icon } from "../../icons";
import { cn } from "../../lib/utils";
import { ConfettiBurst } from "../event/confetti-burst";
import {
  type ChapterPalette,
  POYNT_CHAPTER_PALETTE,
} from "../marketing/chapter-rotator";
import { SectionHeader } from "../section-header";
import { VekstFooterLink, type VekstLink } from "./growth-calculator";
import { vekstVars } from "./palette";
import { Stamp } from "./stamp";

export interface Myth {
  lie: string;
  truth: string;
}

export interface MythCardsProps {
  eyebrow?: string;
  title?: string;
  intro?: string;
  myths: Myth[];
  /** Vises når alle kortene er snudd. */
  link?: VekstLink;
  palette?: ChapterPalette;
  className?: string;
}

/**
 * Løgnene som hindrer vekst, som vendekort. Forsiden har løgnen med stempel,
 * baksiden sannheten i bokfarge. En teller holder oversikt, og når alle er
 * avslørt kommer et lite konfetti-smell.
 */
export function MythCards({
  eyebrow,
  title,
  intro,
  myths,
  link,
  palette = POYNT_CHAPTER_PALETTE,
  className,
}: MythCardsProps) {
  const [flipped, setFlipped] = useState<boolean[]>(() =>
    myths.map(() => false)
  );
  const [burst, setBurst] = useState(0);

  if (myths.length === 0) return null;

  const count = flipped.filter(Boolean).length;
  const all = count === myths.length;

  function update(next: boolean[]) {
    const nowAll = next.every(Boolean);
    if (nowAll && !all) setBurst((b) => b + 1);
    setFlipped(next);
  }

  return (
    <div style={vekstVars(palette)} className={className}>
      <SectionHeader eyebrow={eyebrow} title={title} intro={intro} />

      <div className="relative mb-5 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-3xl bg-card px-5 py-4 ring-1 ring-foreground/10">
        {all && burst > 0 && <ConfettiBurst key={burst} className="top-0" />}
        <p aria-live="polite" className="font-heading font-semibold">
          {all
            ? `Alle ${myths.length} løgnene er avslørt.`
            : `Du har avslørt ${count} av ${myths.length} løgner.`}
        </p>
        <span aria-hidden="true" className="flex flex-wrap gap-1.5">
          {flipped.map((isFlipped, i) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: fast rekkefølge, én prikk per kort
              key={i}
              className={cn(
                "size-2.5 rounded-full transition-colors duration-300",
                isFlipped ? "bg-[var(--vk-surface)]" : "bg-foreground/15"
              )}
            />
          ))}
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-x-5 gap-y-2">
          {all && link && <VekstFooterLink link={link} />}
          <button
            type="button"
            onClick={() => update(myths.map(() => !all))}
            className="inline-flex items-center gap-1.5 font-heading font-semibold text-muted-foreground text-sm transition-colors hover:text-foreground"
          >
            <Icon name="refresh" className="size-4" />
            {all ? "Snu alle tilbake" : "Snu alle"}
          </button>
        </div>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {myths.map((myth, i) => {
          const isFlipped = flipped[i];
          return (
            <li key={myth.lie} className="perspective-[1400px]">
              <button
                type="button"
                aria-pressed={isFlipped}
                onClick={() =>
                  update(flipped.map((f, k) => (k === i ? !f : f)))
                }
                className="grid w-full text-left transition-transform duration-500 ease-[cubic-bezier(0.3,1.3,0.6,1)] transform-3d focus-visible:outline-none motion-reduce:transition-none"
                style={{ transform: isFlipped ? "rotateY(180deg)" : "none" }}
              >
                <span
                  aria-hidden={isFlipped}
                  className="col-start-1 row-start-1 flex min-h-52 flex-col gap-4 rounded-3xl bg-card p-6 ring-1 ring-foreground/10 backface-hidden in-focus-visible:ring-2 in-focus-visible:ring-ring"
                >
                  <Stamp tone="alarm" className="self-start text-xs">
                    Løgn #{i + 1}
                  </Stamp>
                  <span className="text-balance font-bold font-heading text-xl leading-snug md:text-2xl">
                    {myth.lie}
                  </span>
                  <span className="mt-auto inline-flex items-center gap-1.5 text-muted-foreground text-sm">
                    <Icon name="refresh" className="size-4" />
                    Snu kortet
                  </span>
                </span>
                <span
                  aria-hidden={!isFlipped}
                  className="col-start-1 row-start-1 flex min-h-52 rotate-y-180 flex-col gap-3 rounded-3xl bg-[var(--vk-surface)] p-6 text-[var(--vk-ink)] backface-hidden"
                >
                  <span className="self-start rounded-full bg-[var(--vk-accent)] px-3 py-1 font-heading font-semibold text-[var(--vk-accent-ink)] text-xs uppercase tracking-wider">
                    Sannheten
                  </span>
                  <span className="text-base leading-relaxed">
                    {myth.truth}
                  </span>
                  <span className="mt-auto text-[var(--vk-ink-soft)] text-sm">
                    Løgn #{i + 1}: {myth.lie}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
