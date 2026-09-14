import { PayloadImage } from "@/components/payload-image";
import {
  eventDateParts,
  formatEventLocation,
  formatEventTime,
} from "@/lib/events/format";
import { resolveMedia } from "@/lib/payload";
import type { Event } from "@/payload-types";
import { Badge, EventDateBadge, cn } from "@poynt/ui";
import Link from "next/link";

/** Kort i eventoversikten. Tidligere eventer tones ned. */
export function EventCard({ event, past }: { event: Event; past?: boolean }) {
  const image = resolveMedia(event.heroImage);
  const { day, month } = eventDateParts(event.startsAt);
  const where = formatEventLocation(event.location);

  return (
    <Link
      href={`/eventer/${event.slug}`}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-3xl bg-card ring-1 ring-border transition-shadow hover:shadow-lg",
        past && "opacity-75"
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-accent-3/40">
        {image?.url && (
          <PayloadImage
            media={image}
            alt={image.alt || event.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}
        <EventDateBadge
          day={day}
          month={month}
          tone={past ? "mint" : "saffron"}
          className="absolute top-4 left-4 bg-card"
        />
        {event.eventStatus && event.eventStatus !== "scheduled" && (
          <Badge variant="destructive" className="absolute top-4 right-4">
            {event.eventStatus === "cancelled" ? "Avlyst" : "Utsatt"}
          </Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-6">
        <p className="text-muted-foreground text-sm">
          kl. {formatEventTime(event.startsAt)}
          {where ? ` · ${where}` : ""}
        </p>
        <h3 className="text-balance font-bold font-heading text-foreground text-xl leading-snug group-hover:text-primary">
          {event.title}
        </h3>
        {event.excerpt && (
          <p className="line-clamp-3 text-muted-foreground text-sm leading-relaxed">
            {event.excerpt}
          </p>
        )}
      </div>
    </Link>
  );
}
