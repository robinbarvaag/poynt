"use client";

import { Icon } from "../../icons";
import { cn } from "../../lib/utils";

export interface StepPagerLink {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface StepPagerProps {
  prev?: StepPagerLink;
  next?: StepPagerLink;
  completed?: boolean;
  onToggleComplete?: () => void;
  className?: string;
}

/**
 * Bunn-navigasjon for en leksjon/steg: forrige, marker som fullført, neste.
 * «Fullført» er en synlig tilstandsbryter som kobler til kursfremdriften.
 */
export function StepPager({
  prev,
  next,
  completed,
  onToggleComplete,
  className,
}: StepPagerProps) {
  const PrevTag = prev?.href ? "a" : "button";
  const NextTag = next?.href ? "a" : "button";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-foreground/10 border-t pt-6 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      {prev ? (
        <PrevTag
          href={prev.href}
          onClick={prev.onClick}
          type={prev.href ? undefined : "button"}
          className="inline-flex items-center gap-2 font-medium text-muted-foreground text-sm transition-colors hover:text-foreground"
        >
          <Icon name="chevron-left" className="size-4" />
          {prev.label}
        </PrevTag>
      ) : (
        <span />
      )}

      {onToggleComplete && (
        <button
          type="button"
          onClick={onToggleComplete}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5 font-medium text-sm transition-colors",
            completed
              ? "bg-mint text-foreground"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          <Icon name={completed ? "check-circle" : "check"} className="size-4" />
          {completed ? "Fullført" : "Marker som fullført"}
        </button>
      )}

      {next ? (
        <NextTag
          href={next.href}
          onClick={next.onClick}
          type={next.href ? undefined : "button"}
          className="inline-flex items-center gap-2 font-semibold text-primary text-sm transition-colors hover:text-primary/80"
        >
          {next.label}
          <Icon name="chevron-right" className="size-4" />
        </NextTag>
      ) : (
        <span />
      )}
    </div>
  );
}
