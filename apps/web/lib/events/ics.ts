/**
 * Kalenderfil (.ics, RFC 5545) for et event — legges ved bekreftelsen og kan
 * lastes ned fra billettsiden. Tidene skrives i UTC, så kalenderen viser riktig
 * lokal tid uten at vi trenger en VTIMEZONE-blokk.
 */

export interface IcsEvent {
  /** Stabil, unik id — samme event gir samme id, så kalenderen ikke dupliserer. */
  uid: string;
  title: string;
  startsAt: string | Date;
  /** Uten sluttid legges det på to timer. */
  endsAt?: string | Date | null;
  description?: string | null;
  location?: string | null;
  url?: string | null;
}

const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000;

function toUtcStamp(value: string | Date): string {
  return new Date(value)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Linjer over 75 oktetter brettes (fortsettelseslinjer starter med mellomrom). */
function foldLine(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;

  const parts: string[] = [];
  let current = "";
  let currentBytes = 0;
  for (const char of line) {
    const charBytes = new TextEncoder().encode(char).length;
    const limit = parts.length === 0 ? 75 : 74;
    if (currentBytes + charBytes > limit) {
      parts.push(current);
      current = "";
      currentBytes = 0;
    }
    current += char;
    currentBytes += charBytes;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

export function buildIcs(event: IcsEvent, now: Date = new Date()): string {
  const start = new Date(event.startsAt);
  const end = event.endsAt
    ? new Date(event.endsAt)
    : new Date(start.getTime() + DEFAULT_DURATION_MS);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Poynt//Eventer//NO",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${toUtcStamp(now)}`,
    `DTSTART:${toUtcStamp(start)}`,
    `DTEND:${toUtcStamp(end)}`,
    `SUMMARY:${escapeText(event.title)}`,
    event.description ? `DESCRIPTION:${escapeText(event.description)}` : null,
    event.location ? `LOCATION:${escapeText(event.location)}` : null,
    event.url ? `URL:${event.url}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((line): line is string => line !== null);

  return `${lines.map(foldLine).join("\r\n")}\r\n`;
}
