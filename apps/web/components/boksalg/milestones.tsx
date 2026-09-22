import type { Milestone } from "@/lib/boksalg/milestones";
import { cn } from "@poynt/ui";
import { CircleCheckIcon, CircleDashedIcon } from "lucide-react";

/**
 * Milepæler som brikker: nådde først, med hake og farge; resten dempet med
 * hvor langt det er igjen. Ingen interaksjon — dette er feiringsveggen.
 */
export function Milestones({ items }: { items: Milestone[] }) {
  const reached = items.filter((item) => item.reached);
  const next = items.filter((item) => !item.reached);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">
        <strong className="text-foreground tabular-nums">
          {reached.length} av {items.length}
        </strong>{" "}
        nådd.
        {next[0] &&
          ` Neste: ${next[0].label.toLowerCase()} — ${next[0].detail}.`}
      </p>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {[...reached, ...next].map((item) => (
          <li
            key={item.key}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-3",
              item.reached
                ? "border-primary/30 bg-primary/5"
                : "border-border bg-transparent"
            )}
          >
            {item.reached ? (
              <CircleCheckIcon
                className="text-primary mt-0.5 size-5 shrink-0"
                aria-hidden
              />
            ) : (
              <CircleDashedIcon
                className="text-muted-foreground mt-0.5 size-5 shrink-0"
                aria-hidden
              />
            )}
            <div className="flex min-w-0 flex-col">
              <span
                className={cn(
                  "text-sm font-medium",
                  !item.reached && "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
              <span className="text-muted-foreground text-xs tabular-nums">
                {item.detail}
              </span>
              <span className="sr-only">
                {item.reached ? "Nådd" : "Ikke nådd ennå"}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
