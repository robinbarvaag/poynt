import { cn } from "../../lib/utils";

export interface SpotsMeterProps {
  /** Antall plasser. Uten kapasitet vises ingenting. */
  capacity?: number | null;
  /** Plasser som er tatt (påmeldt + møtt). */
  taken: number;
  waitlistEnabled?: boolean;
  className?: string;
}

/**
 * «23 av 80 plasser igjen» med en fyllingsstripe. Fargen skifter når det
 * begynner å bli trangt (saffron) og når det er fullt (salmon) — ærlig
 * knapphet, ikke kunstig.
 */
export function SpotsMeter({
  capacity,
  taken,
  waitlistEnabled,
  className,
}: SpotsMeterProps) {
  if (!capacity || capacity <= 0) return null;

  const left = Math.max(0, capacity - taken);
  const ratio = Math.min(1, taken / capacity);
  const full = left === 0;
  const almost = !full && left <= Math.max(3, Math.ceil(capacity * 0.15));

  const label = full
    ? waitlistEnabled
      ? "Fullt, men ventelista er åpen"
      : "Fullt"
    : almost
      ? `Bare ${left} ${left === 1 ? "plass" : "plasser"} igjen`
      : `${left} av ${capacity} plasser igjen`;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-semibold text-foreground">{label}</span>
        {!full && (
          <span className="text-muted-foreground tabular-nums">
            {taken}/{capacity}
          </span>
        )}
      </div>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-muted"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={capacity}
        aria-valuenow={Math.min(taken, capacity)}
        aria-label="Plasser tatt"
      >
        <div
          className={cn(
            "h-full rounded-full motion-safe:transition-[width] motion-safe:duration-700 motion-safe:ease-out",
            full ? "bg-accent-2" : almost ? "bg-accent-1" : "bg-primary"
          )}
          style={{ width: `${Math.max(4, ratio * 100)}%` }}
        />
      </div>
    </div>
  );
}
