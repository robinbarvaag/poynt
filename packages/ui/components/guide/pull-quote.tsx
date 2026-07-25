import type * as React from "react";
import { cn } from "../../lib/utils";
import { Reveal } from "../motion/reveal";

export type PullQuoteAccent = "primary" | "saffron" | "salmon" | "mint";

export interface PullQuoteProps {
  children: React.ReactNode;
  /** Kilde/attribusjon, vises under sitatet. */
  cite?: string;
  accent?: PullQuoteAccent;
  className?: string;
}

const barByAccent: Record<PullQuoteAccent, string> = {
  primary: "bg-primary",
  saffron: "bg-accent-1",
  salmon: "bg-accent-2",
  mint: "bg-accent-3",
};

/**
 * Stort, redaksjonelt uthevingssitat som bryter opp lange tekstpartier. Bricolage
 * display-type med en farget signaturstrek. Bruk sparsomt — én per artikkel.
 */
export function PullQuote({
  children,
  cite,
  accent = "primary",
  className,
}: PullQuoteProps) {
  return (
    <Reveal>
      <figure className={cn("my-2 flex gap-5 md:gap-7", className)}>
        <span
          aria-hidden="true"
          className={cn("w-1.5 shrink-0 rounded-full", barByAccent[accent])}
        />
        <div className="flex flex-col gap-3">
          <blockquote className="text-balance font-bold font-heading text-2xl text-foreground leading-[1.15] tracking-tight md:text-[1.9rem]">
            {children}
          </blockquote>
          {cite && (
            <figcaption className="text-muted-foreground text-sm">
              — {cite}
            </figcaption>
          )}
        </div>
      </figure>
    </Reveal>
  );
}
