"use client";

import type * as React from "react";
import { cn } from "../../lib/utils";
import { DriftingBlob } from "../motion/drifting-blob";
import { Reveal } from "../motion/reveal";

export type GuideHeroAccent = "primary" | "saffron" | "salmon" | "mint";

const blobByAccent: Record<GuideHeroAccent, string> = {
  primary: "bg-primary/30",
  saffron: "bg-saffron/40",
  salmon: "bg-salmon/40",
  mint: "bg-mint/50",
};

// Merkevare-tro bakgrunnsgradient når guiden ennå ikke har et cover-bilde.
const backdropByAccent: Record<GuideHeroAccent, string> = {
  primary: "bg-gradient-to-br from-primary/25 via-mint/30 to-background",
  saffron: "bg-gradient-to-br from-saffron/40 via-background to-mint/30",
  salmon: "bg-gradient-to-br from-salmon/40 via-background to-saffron/25",
  mint: "bg-gradient-to-br from-mint/50 via-background to-salmon/20",
};

export interface GuideHeroProps {
  title: string;
  lede?: string;
  /** Emoji-ikon vist i en flytende «chip» over tittelen. */
  icon?: string;
  /** Liten ledetekst over tittelen (f.eks. kategori/kanal). */
  eyebrow?: string;
  /** Signaturfarge på den drivende blob-en bak innholdet. */
  accent?: GuideHeroAccent;
  /** Cover-bilde (typisk et <Image>). Får en mild parallax-drift. */
  cover?: React.ReactNode;
  className?: string;
}

/**
 * Full-bredde hero for en guide: cover-bilde med parallax-drift, en drivende
 * fargeblob som signatur, emoji-chip og tittel/ingress som glir inn. Tekst får
 * aldri parallax — kun dekor beveger seg. Respekterer prefers-reduced-motion via
 * de underliggende motion-primitivene.
 */
export function GuideHero({
  title,
  lede,
  icon,
  eyebrow,
  accent = "mint",
  cover,
  className,
}: GuideHeroProps) {
  return (
    <header
      className={cn(
        "relative isolate overflow-hidden rounded-b-[2.5rem]",
        className
      )}
    >
      {/* Cover-bilde som fyller hero-en (dekor bak innholdet) … */}
      {cover ? (
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 *:[img]:h-full *:[img]:w-full *:[img]:object-cover">
            {cover}
          </div>
          {/* Lesbarhets-gradient over bildet */}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/75 via-foreground/35 to-foreground/10" />
        </div>
      ) : (
        // … ellers en merkevare-tro gradient + stort, svakt emoji-vannmerke.
        <div className={cn("absolute inset-0 -z-10", backdropByAccent[accent])}>
          {icon && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-4 bottom-0 select-none text-[10rem] opacity-10 md:text-[16rem]"
            >
              {icon}
            </span>
          )}
        </div>
      )}

      {/* Signatur-blob */}
      <DriftingBlob
        className={cn(
          "-right-16 -top-10 size-72 blur-3xl",
          blobByAccent[accent]
        )}
      />

      <div
        className={cn(
          "mx-auto flex max-w-3xl flex-col gap-4 px-6 py-16 md:py-24",
          cover ? "text-background" : "text-foreground"
        )}
      >
        <Reveal>
          {icon && (
            <span
              aria-hidden="true"
              className="mb-1 inline-flex size-14 items-center justify-center rounded-2xl bg-background/90 text-3xl shadow-md ring-1 ring-foreground/10"
            >
              {icon}
            </span>
          )}
        </Reveal>

        <Reveal delay={0.05}>
          <div className="flex flex-col gap-3">
            {eyebrow && (
              <span className="font-heading font-semibold text-sm uppercase tracking-[0.18em] opacity-90">
                {eyebrow}
              </span>
            )}
            <h1 className="font-bold font-heading text-4xl leading-[1.05] tracking-tight md:text-6xl">
              {title}
            </h1>
            {lede && (
              <p className="max-w-2xl text-lg leading-relaxed opacity-90 md:text-xl">
                {lede}
              </p>
            )}
          </div>
        </Reveal>
      </div>
    </header>
  );
}
