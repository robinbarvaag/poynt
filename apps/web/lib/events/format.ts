/**
 * Norsk visning av tid og sted for eventer. Alt vises i norsk tid
 * (Europe/Oslo), uansett hvor serveren kjører — Vercel står i UTC.
 */

const TIME_ZONE = "Europe/Oslo";

const dateFormat = new Intl.DateTimeFormat("nb-NO", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: TIME_ZONE,
});

const shortDateFormat = new Intl.DateTimeFormat("nb-NO", {
  day: "numeric",
  month: "short",
  timeZone: TIME_ZONE,
});

const timeFormat = new Intl.DateTimeFormat("nb-NO", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TIME_ZONE,
});

const dayKeyFormat = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: TIME_ZONE,
});

function toDate(value: string | Date): Date {
  return typeof value === "string" ? new Date(value) : value;
}

const partsFormat = new Intl.DateTimeFormat("nb-NO", {
  day: "numeric",
  month: "short",
  timeZone: TIME_ZONE,
});

/** Dag og kort måned hver for seg, til kalender-merket: { day: "15", month: "okt" }. */
export function eventDateParts(value: string | Date): {
  day: string;
  month: string;
} {
  const parts = partsFormat.formatToParts(toDate(value));
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  const month = (parts.find((p) => p.type === "month")?.value ?? "").replace(
    ".",
    ""
  );
  return { day, month };
}

/** «torsdag 15. oktober 2026» */
export function formatEventDay(value: string | Date): string {
  return dateFormat.format(toDate(value));
}

/** «15. okt.» — til kort og lister. */
export function formatEventShortDay(value: string | Date): string {
  return shortDateFormat.format(toDate(value));
}

/** «18:00» */
export function formatEventTime(value: string | Date): string {
  return timeFormat.format(toDate(value));
}

/**
 * Hele tidsrommet på én linje:
 * - samme dag: «torsdag 15. oktober 2026, kl. 18:00–21:00»
 * - over flere dager: «fredag 16. oktober 2026, kl. 09:00 – lørdag 17. oktober 2026, kl. 16:00»
 */
export function formatEventRange(
  startsAt: string | Date,
  endsAt?: string | Date | null
): string {
  const start = toDate(startsAt);
  const startText = `${formatEventDay(start)}, kl. ${formatEventTime(start)}`;
  if (!endsAt) return startText;

  const end = toDate(endsAt);
  if (dayKeyFormat.format(start) === dayKeyFormat.format(end)) {
    return `${startText}–${formatEventTime(end)}`;
  }
  return `${startText} – ${formatEventDay(end)}, kl. ${formatEventTime(end)}`;
}

export interface EventLocation {
  name?: string | null;
  address?: string | null;
  mapUrl?: string | null;
  online?: boolean | null;
}

/** «Tou Scene, Kvitsøygata 25, 4014 Stavanger» / «Digitalt» / "" */
export function formatEventLocation(
  location: EventLocation | null | undefined
): string {
  if (!location) return "";
  const parts = [location.name, location.address?.replace(/\s*\n\s*/g, ", ")]
    .map((part) => part?.trim())
    .filter(Boolean);
  if (parts.length) return parts.join(", ");
  return location.online ? "Digitalt" : "";
}
