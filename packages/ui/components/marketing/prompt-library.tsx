"use client";

import { useEffect, useState } from "react";
import { Icon } from "../../icons";
import { cn } from "../../lib/utils";
import { gridVariants } from "../container";
import { Stagger, StaggerItem } from "../motion";
import { SectionHeader } from "../section-header";

export interface PromptItem {
  title: string;
  /** Når og hvorfor prompten er nyttig — én–to setninger. */
  description?: string;
  /** Selve prompten, akkurat slik den skal limes inn. Linjeskift bevares. */
  prompt: string;
  /** Hvilket verktøy den er skrevet for («ChatGPT», «Claude», …). */
  tool?: string;
  tags?: string[];
}

export interface PromptLibraryProps {
  eyebrow?: string;
  title?: string;
  intro?: string;
  prompts: PromptItem[];
  /** Kolonner på desktop. Default 2. */
  columns?: 1 | 2 | 3;
  className?: string;
}

/** Omtrent så mange linjer som vises før «Vis hele» dukker opp. */
const COLLAPSED_LINES = 7;

function useCopy(text: string) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Uten clipboard-tilgang (gammel nettleser, http) markerer vi teksten
      // så brukeren kan kopiere selv.
      setCopied(false);
    }
  }
  return { copied, copy };
}

/**
 * Ett prompt-kort: tittel og bruksområde over, selve prompten i en
 * monospace-flate under, med «Kopier» som den ene handlingen. Lange prompter
 * foldes sammen så lista forblir skannbar.
 */
export function PromptCard({
  item,
  className,
}: {
  item: PromptItem;
  className?: string;
}) {
  const { copied, copy } = useCopy(item.prompt);
  const lineCount = item.prompt.split("\n").length;
  const isLong = lineCount > COLLAPSED_LINES || item.prompt.length > 520;
  const [open, setOpen] = useState(!isLong);

  return (
    <article
      className={cn(
        "flex h-full flex-col gap-4 rounded-3xl bg-card p-5 ring-1 ring-foreground/10 transition-shadow duration-300 hover:shadow-md md:p-6",
        className
      )}
    >
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {item.tool && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-3/60 px-2.5 py-1 font-heading font-semibold text-foreground text-xs">
              <Icon name="bot" className="size-3.5 text-primary" />
              {item.tool}
            </span>
          )}
          {item.tags?.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted px-2.5 py-1 font-medium text-[0.7rem] text-muted-foreground uppercase tracking-wide"
            >
              {tag}
            </span>
          ))}
        </div>
        <h3 className="font-bold font-heading text-lg leading-snug tracking-tight">
          {item.title}
        </h3>
        {item.description && (
          <p className="text-muted-foreground text-sm leading-relaxed">
            {item.description}
          </p>
        )}
      </header>

      <div className="relative">
        <pre
          className={cn(
            "overflow-hidden whitespace-pre-wrap break-words rounded-2xl bg-muted/60 p-4 font-mono text-[0.8rem] text-foreground/90 leading-relaxed ring-1 ring-foreground/5",
            !open && "max-h-44"
          )}
        >
          {item.prompt}
        </pre>
        {!open && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 rounded-b-2xl bg-gradient-to-t from-card to-transparent"
          />
        )}
      </div>

      <footer className="mt-auto flex items-center justify-between gap-3">
        {isLong ? (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="font-heading font-semibold text-muted-foreground text-sm transition-colors hover:text-foreground"
            aria-expanded={open}
          >
            {open ? "Skjul" : "Vis hele prompten"}
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={copy}
          className={cn(
            "pressable inline-flex items-center gap-2 rounded-full px-4 py-2 font-heading font-semibold text-sm transition-colors duration-200",
            copied
              ? "bg-accent-3 text-foreground"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          aria-live="polite"
        >
          <Icon name={copied ? "check" : "copy"} className="size-4" />
          {copied ? "Kopiert" : "Kopier prompt"}
        </button>
      </footer>
    </article>
  );
}

/**
 * Prompt-bibliotek: et rutenett av prompter som kan kopieres med ett trykk.
 * Bygd for ressurssider der leseren skal hente noe konkret og gå videre, ikke
 * lese — derfor er kopier-knappen det mest synlige på hvert kort.
 */
export function PromptLibrary({
  eyebrow,
  title,
  intro,
  prompts,
  columns = 2,
  className,
}: PromptLibraryProps) {
  if (prompts.length === 0) return null;
  return (
    <div className={className}>
      <SectionHeader eyebrow={eyebrow} title={title} intro={intro} />
      <Stagger className={cn(gridVariants({ cols: columns, gap: "md" }))}>
        {prompts.map((item, i) => (
          <StaggerItem key={`${item.title}-${i}`} className="h-full">
            <PromptCard item={item} />
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
