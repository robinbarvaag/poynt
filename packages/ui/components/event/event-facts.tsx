import {
  CalendarDays,
  Clock,
  DoorOpen,
  type LucideIcon,
  MapPin,
  Ticket,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export type EventFactIcon = "calendar" | "clock" | "map" | "ticket" | "door";

export interface EventFact {
  icon: EventFactIcon;
  label: string;
  value: ReactNode;
  /** Gjør verdien til en lenke (kart, kalenderfil …). */
  href?: string;
}

export interface EventFactsProps {
  items: EventFact[];
  className?: string;
}

const ICONS: Record<EventFactIcon, LucideIcon> = {
  calendar: CalendarDays,
  clock: Clock,
  map: MapPin,
  ticket: Ticket,
  door: DoorOpen,
};

/** Når/hvor/pris som små faktakort — det folk leter etter først. */
export function EventFacts({ items, className }: EventFactsProps) {
  if (!items.length) return null;

  return (
    <dl className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        return (
          <div
            key={item.label}
            className="flex items-start gap-3 rounded-2xl bg-card p-4 ring-1 ring-border"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <dt className="font-semibold text-muted-foreground text-xs uppercase tracking-[0.12em]">
                {item.label}
              </dt>
              <dd className="mt-0.5 font-medium text-foreground leading-snug">
                {item.href ? (
                  <a
                    href={item.href}
                    className="underline decoration-primary/30 underline-offset-4 hover:decoration-primary"
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={
                      item.href.startsWith("http")
                        ? "noopener noreferrer"
                        : undefined
                    }
                  >
                    {item.value}
                  </a>
                ) : (
                  item.value
                )}
              </dd>
            </div>
          </div>
        );
      })}
    </dl>
  );
}
