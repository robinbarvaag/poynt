import { cn } from "../../lib/utils";

export interface EventDateBadgeProps {
  /** «15» */
  day: string;
  /** «okt» */
  month: string;
  /** Fargen på måneds-stripa øverst. */
  tone?: "saffron" | "salmon" | "mint" | "primary";
  size?: "md" | "lg";
  className?: string;
}

const tones = {
  saffron: "bg-accent-1 text-foreground",
  salmon: "bg-accent-2 text-foreground",
  mint: "bg-accent-3 text-foreground",
  primary: "bg-primary text-primary-foreground",
} as const;

/**
 * Riv-av-kalenderblad med dato. Gjør et event gjenkjennelig i lister og
 * gir heroen et lite, lekent holdepunkt ved siden av tittelen.
 */
export function EventDateBadge({
  day,
  month,
  tone = "saffron",
  size = "md",
  className,
}: EventDateBadgeProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col overflow-hidden rounded-2xl text-center shadow-sm ring-1 ring-border",
        size === "lg" ? "w-20" : "w-16",
        className
      )}
    >
      <span
        className={cn(
          "py-1 font-bold text-xs uppercase tracking-[0.14em]",
          tones[tone]
        )}
      >
        {month}
      </span>
      <span
        className={cn(
          "bg-card font-bold font-heading text-primary tabular-nums leading-none",
          size === "lg" ? "py-2.5 text-4xl" : "py-2 text-3xl"
        )}
      >
        {day}
      </span>
    </div>
  );
}
