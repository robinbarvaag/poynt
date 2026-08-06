import type * as React from "react";
import { Icon } from "../../icons";
import { UILink } from "../../lib/link";
import { cn } from "../../lib/utils";
import type { ContentMetaItem } from "./content-card";

export type CourseHeroSurface = "mint" | "saffron" | "salmon" | "default";

const surfaceClasses: Record<CourseHeroSurface, string> = {
  default: "bg-card",
  mint: "bg-accent-3/40",
  saffron: "bg-accent-1/35",
  salmon: "bg-accent-2/35",
};

export interface CourseHeroProps {
  eyebrow?: string;
  title: string;
  lede?: string;
  cover?: React.ReactNode;
  meta?: ContentMetaItem[];
  /** «Dette lærer du» — punktliste med utbytte. */
  learn?: string[];
  ctaLabel?: string;
  ctaHref?: string;
  surface?: CourseHeroSurface;
  className?: string;
}

/**
 * Forside for et kurs: cover + selvsikker tittel, hva du sitter igjen med, og en
 * tydelig «Start kurset»-CTA. Limet mellom innholds-huben og selve playeren.
 */
export function CourseHero({
  eyebrow = "Kurs",
  title,
  lede,
  cover,
  meta,
  learn,
  ctaLabel = "Start kurset",
  ctaHref = "#",
  surface = "mint",
  className,
}: CourseHeroProps) {
  return (
    <section
      className={cn(
        "grid overflow-hidden rounded-[2rem] ring-1 ring-foreground/10 md:grid-cols-2",
        surfaceClasses[surface],
        className
      )}
    >
      <div className="relative aspect-[16/11] overflow-hidden md:aspect-auto">
        {cover ? (
          <div className="absolute inset-0 *:[img]:h-full *:[img]:w-full *:[img]:object-cover">
            {cover}
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-accent-2/60 via-accent-2/25 to-background">
            <Icon
              name="graduation-cap"
              className="size-20 text-foreground/15"
              strokeWidth={1.5}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-5 p-7 md:p-9">
        <div className="flex flex-col gap-3">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-background/80 px-3 py-1 font-heading font-semibold text-foreground text-xs ring-1 ring-foreground/10">
            <Icon name="graduation-cap" className="size-3.5 text-primary" />
            {eyebrow}
          </span>
          <h1 className="text-balance font-bold font-heading text-3xl leading-[1.1] tracking-tight md:text-[2.5rem]">
            {title}
          </h1>
          {lede && (
            <p className="text-base text-foreground/75 leading-relaxed md:text-lg">
              {lede}
            </p>
          )}
        </div>

        {meta && meta.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-foreground/60 text-sm">
            {meta.map((item) => (
              <span
                key={item.label}
                className="inline-flex items-center gap-1.5"
              >
                {item.icon && <Icon name={item.icon} className="size-4" />}
                {item.label}
              </span>
            ))}
          </div>
        )}

        {learn && learn.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <span className="font-heading font-semibold text-muted-foreground text-xs uppercase tracking-[0.16em]">
              Dette lærer du
            </span>
            <ul className="flex flex-col gap-2">
              {learn.map((point) => (
                <li key={point} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Icon name="check" className="size-3.5" />
                  </span>
                  <span className="text-foreground/80 text-sm leading-relaxed">
                    {point}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <UILink
          href={ctaHref}
          className="mt-1 inline-flex w-fit items-center gap-2 rounded-2xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition-transform duration-300 hover:-translate-y-0.5"
        >
          {ctaLabel}
          <Icon name="arrow-right" className="size-4" />
        </UILink>
      </div>
    </section>
  );
}
