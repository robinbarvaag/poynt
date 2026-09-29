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

/**
 * Hvert kort får sin egen farge fra paletten — samme lekne trio som heroen
 * (cream / celeste / mimi pink) pluss primærgrønn — så raden leser som fire
 * små brikker i stedet for fire like grå bokser.
 */
const TONES: Record<EventFactIcon, { tile: string; blob: string }> = {
  calendar: {
    tile: "bg-accent-1 text-accent-1-foreground",
    blob: "bg-accent-1",
  },
  clock: { tile: "bg-accent-3 text-accent-3-foreground", blob: "bg-accent-3" },
  map: { tile: "bg-accent-2 text-accent-2-foreground", blob: "bg-accent-2" },
  // Mørk primærgrønn blir grumsete i samme dekning som pastellene — tynnes ut.
  ticket: { tile: "bg-primary text-primary-foreground", blob: "bg-primary/50" },
  door: { tile: "bg-accent-3 text-accent-3-foreground", blob: "bg-accent-3" },
};

/** Når/hvor/pris som små faktakort — det folk leter etter først. */
export function EventFacts({ items, className }: EventFactsProps) {
  if (!items.length) return null;

  return (
    <dl className={cn("grid gap-4 sm:grid-cols-2", className)}>
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        const tone = TONES[item.icon];
        const external = item.href?.startsWith("http");
        return (
          <div
            key={item.label}
            className={cn(
              "group relative flex flex-col gap-4 overflow-hidden rounded-3xl bg-card p-5 shadow-sm ring-1 ring-border",
              item.href &&
                "motion-safe:transition-transform motion-safe:hover:-translate-y-0.5"
            )}
          >
            {/* Myk fargeflekk i hjørnet — samme grep som heroens skjeve bakplate. */}
            <span
              aria-hidden
              className={cn(
                // design-unntak: dekorativ fargeflekk (aria-hidden)
                "absolute -top-8 -right-8 size-28 rounded-full opacity-40 motion-safe:transition-transform motion-safe:duration-500 group-hover:scale-110",
                tone.blob
              )}
            />
            <span
              className={cn(
                "relative flex size-11 shrink-0 items-center justify-center rounded-2xl shadow-sm",
                tone.tile
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <div className="relative min-w-0">
              <dt className="font-semibold text-muted-foreground text-xs uppercase tracking-[0.12em]">
                {item.label}
              </dt>
              <dd className="mt-1 font-bold font-heading text-foreground text-lg leading-snug">
                {item.href ? (
                  <a
                    href={item.href}
                    className="underline decoration-primary/30 decoration-2 underline-offset-4 hover:decoration-primary"
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
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
