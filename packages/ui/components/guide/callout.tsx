"use client";

import type * as React from "react";
import { cn } from "../../lib/utils";
import { Reveal } from "../motion/reveal";

export type CalloutTone = "mint" | "saffron" | "salmon" | "primary" | "ink";

const toneClasses: Record<CalloutTone, string> = {
  mint: "bg-mint/60 text-foreground ring-foreground/10",
  saffron: "bg-saffron/50 text-foreground ring-foreground/10",
  salmon: "bg-salmon/50 text-foreground ring-foreground/10",
  primary: "bg-primary text-primary-foreground ring-white/10",
  ink: "bg-foreground text-background ring-white/10",
};

export interface CalloutProps {
  tone?: CalloutTone;
  /** Emoji-ikon. */
  icon?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Farget callout-boks med emoji-ikon (à la Notion-callout). Glir inn på scroll.
 * Innholdet sendes som ferdig-rendret rik tekst (children).
 */
export function Callout({
  tone = "mint",
  icon,
  children,
  className,
}: CalloutProps) {
  return (
    <Reveal>
      <aside
        className={cn(
          "flex gap-4 rounded-3xl p-6 ring-1 md:p-7",
          toneClasses[tone],
          className
        )}
      >
        {icon && (
          <span
            aria-hidden="true"
            className="shrink-0 text-2xl leading-none md:text-3xl"
          >
            {icon}
          </span>
        )}
        <div className="prose-callout min-w-0 flex-1 leading-relaxed [&_a]:underline [&_p+p]:mt-3 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>
      </aside>
    </Reveal>
  );
}
