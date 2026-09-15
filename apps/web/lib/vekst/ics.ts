/**
 * Kalenderfil (.ics) for en fast ukentlig avtale, f.eks. «Omsetnings-onsdag».
 * Rene funksjoner: `app/api/kalender/route.ts` tolker query-parametrene og
 * serverer fila. Tidene er alltid i Europe/Oslo.
 */

export const WEEKDAYS = {
  MO: { label: "mandag", short: "MAN", dow: 1 },
  TU: { label: "tirsdag", short: "TIR", dow: 2 },
  WE: { label: "onsdag", short: "ONS", dow: 3 },
  TH: { label: "torsdag", short: "TOR", dow: 4 },
  FR: { label: "fredag", short: "FRE", dow: 5 },
  SA: { label: "lørdag", short: "LØR", dow: 6 },
  SU: { label: "søndag", short: "SØN", dow: 0 },
} as const;

export type Weekday = keyof typeof WEEKDAYS;

export function isWeekday(value: unknown): value is Weekday {
  return typeof value === "string" && value in WEEKDAYS;
}

export interface WeeklyEvent {
  title: string;
  description?: string;
  weekday: Weekday;
  /** «HH:MM» */
  startTime: string;
  durationMinutes: number;
}

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;
const MAX_TITLE = 120;
const MAX_DESCRIPTION = 600;

export function isTime(value: unknown): value is string {
  return typeof value === "string" && TIME.test(value);
}

/** Sluttid som «HH:MM» (går rundt midnatt). */
export function endTime(startTime: string, durationMinutes: number): string {
  const match = TIME.exec(startTime);
  if (!match) return startTime;
  const total =
    (Number(match[1]) * 60 + Number(match[2]) + durationMinutes) % (24 * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Tolker og validerer query-parametrene. `null` når noe er ugyldig. */
export function parseWeeklyEventParams(
  params: URLSearchParams
): WeeklyEvent | null {
  const title = (params.get("title") ?? "").trim().slice(0, MAX_TITLE);
  const description = (params.get("description") ?? "")
    .trim()
    .slice(0, MAX_DESCRIPTION);
  const weekday = params.get("day");
  const startTime = params.get("start");
  const duration = Number(params.get("duration"));

  if (!title || !isWeekday(weekday) || !isTime(startTime)) return null;
  if (!Number.isInteger(duration) || duration < 15 || duration > 720) {
    return null;
  }
  return {
    title,
    description: description || undefined,
    weekday,
    startTime,
    durationMinutes: duration,
  };
}

/** Lager lenken til kalenderfila. */
export function weeklyEventHref(event: WeeklyEvent): string {
  const params = new URLSearchParams({
    title: event.title,
    day: event.weekday,
    start: event.startTime,
    duration: String(event.durationMinutes),
  });
  if (event.description) params.set("description", event.description);
  return `/api/kalender?${params.toString()}`;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Dagens dato og ukedag i Oslo. */
function osloToday(now: Date): {
  y: number;
  m: number;
  d: number;
  dow: number;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Oslo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const dowNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    y: Number(get("year")),
    m: Number(get("month")),
    d: Number(get("day")),
    dow: dowNames.indexOf(get("weekday")),
  };
}

/** Første dato (i Oslo, «YYYYMMDD») med gitt ukedag, fra og med i dag. */
export function nextWeekdayDate(now: Date, weekday: Weekday): string {
  const today = osloToday(now);
  const days = (WEEKDAYS[weekday].dow - today.dow + 7) % 7;
  const date = new Date(Date.UTC(today.y, today.m - 1, today.d + days));
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
}

function escapeText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

const encoder = new TextEncoder();

/** RFC 5545: linjer over 75 oktetter brettes med CRLF + mellomrom. */
export function foldLine(line: string): string {
  if (encoder.encode(line).length <= 75) return line;
  const chunks: string[] = [];
  let current = "";
  let currentBytes = 0;
  for (const char of line) {
    const bytes = encoder.encode(char).length;
    const limit = chunks.length === 0 ? 75 : 74;
    if (currentBytes + bytes > limit) {
      chunks.push(current);
      current = "";
      currentBytes = 0;
    }
    current += char;
    currentBytes += bytes;
  }
  chunks.push(current);
  return chunks.join("\r\n ");
}

function slug(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "avtale"
  );
}

const OSLO_TIMEZONE = [
  "BEGIN:VTIMEZONE",
  "TZID:Europe/Oslo",
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:+0100",
  "TZOFFSETTO:+0200",
  "TZNAME:CEST",
  "DTSTART:19700329T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:+0200",
  "TZOFFSETTO:+0100",
  "TZNAME:CET",
  "DTSTART:19701025T030000",
  "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
];

export function icsFileName(event: WeeklyEvent): string {
  return `${slug(event.title)}.ics`;
}

/** Hele kalenderfila, med CRLF-linjeskift. */
export function buildWeeklyIcs(event: WeeklyEvent, now = new Date()): string {
  const date = nextWeekdayDate(now, event.weekday);
  const time = event.startTime.replace(":", "");
  const stamp = now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  // Stabil UID: laster man ned fila på nytt, oppdateres samme avtale.
  const uid = `${slug(event.title)}-${event.weekday}-${time}@poynt.no`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Poynt//Verdifull vekst//NO",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...OSLO_TIMEZONE,
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=Europe/Oslo:${date}T${time}00`,
    `DURATION:PT${event.durationMinutes}M`,
    `RRULE:FREQ=WEEKLY;BYDAY=${event.weekday}`,
    `SUMMARY:${escapeText(event.title)}`,
    ...(event.description
      ? [`DESCRIPTION:${escapeText(event.description)}`]
      : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `${lines.map(foldLine).join("\r\n")}\r\n`;
}
