"use client";

import { useEffect, useState } from "react";
import { cn } from "../../lib/utils";

export interface CountdownProps {
  /** Måldato som ISO-streng (f.eks. "2027-03-01T09:00:00+01:00"). */
  target: string;
  /** Vises i stedet for tallene når datoen har passert. */
  doneLabel?: string;
  /** Tonen på tallene — matcher panel-flatene i @poynt/ui. */
  tone?: "default" | "onPrimary";
  className?: string;
}

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const UNITS: { key: keyof Remaining; label: string }[] = [
  { key: "days", label: "dager" },
  { key: "hours", label: "timer" },
  { key: "minutes", label: "min" },
  { key: "seconds", label: "sek" },
];

function remainingFrom(targetMs: number): Remaining | null {
  const diff = targetMs - Date.now();
  if (diff <= 0) return null;
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

/**
 * Nedtelling til en dato. Tallene BEVEGER seg ikke når de skifter: en
 * animasjon som spilles hvert sekund blir støy, ikke liv — det levende her er
 * at tallet faktisk teller. Tid regnes først etter mount (serveren og
 * nettleseren har ulik «nå», så alt annet gir hydration-mismatch).
 */
export function Countdown({
  target,
  doneLabel = "Den er her!",
  tone = "default",
  className,
}: CountdownProps) {
  const targetMs = new Date(target).getTime();
  const [remaining, setRemaining] = useState<Remaining | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (Number.isNaN(targetMs)) return;
    setMounted(true);
    setRemaining(remainingFrom(targetMs));
    const timer = setInterval(
      () => setRemaining(remainingFrom(targetMs)),
      1000
    );
    return () => clearInterval(timer);
  }, [targetMs]);

  if (Number.isNaN(targetMs)) return null;

  const onPrimary = tone === "onPrimary";

  if (mounted && !remaining) {
    return (
      <p
        className={cn(
          "font-bold font-heading text-3xl tracking-tight md:text-4xl",
          onPrimary ? "text-primary-foreground" : "text-primary",
          className
        )}
      >
        {doneLabel}
      </p>
    );
  }

  return (
    <div
      className={cn("flex flex-wrap gap-3 sm:gap-4", className)}
      // Skjermlesere skal ikke få opplest et nytt tall hvert sekund.
      aria-hidden="true"
    >
      {UNITS.map(({ key, label }) => (
        <div
          key={key}
          className={cn(
            "min-w-[4.5rem] rounded-2xl px-4 py-3 text-center sm:min-w-20",
            onPrimary
              ? "bg-primary-foreground/10 ring-1 ring-primary-foreground/15"
              : "bg-card ring-1 ring-border"
          )}
        >
          <span
            className={cn(
              "block font-bold font-heading text-3xl leading-none tabular-nums tracking-tight sm:text-4xl",
              onPrimary ? "text-primary-foreground" : "text-primary"
            )}
          >
            {remaining ? String(remaining[key]).padStart(2, "0") : "––"}
          </span>
          <span
            className={cn(
              "mt-1.5 block text-xs uppercase tracking-[0.14em]",
              onPrimary ? "text-primary-foreground/70" : "text-muted-foreground"
            )}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
