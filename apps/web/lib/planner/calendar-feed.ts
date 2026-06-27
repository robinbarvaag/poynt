import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { getSessionWithMembership } from "@/lib/membership";
import { db, eq } from "@poynt/planner-db";
import { plannerWorkspaceMember } from "@poynt/planner-db/schema";
import type { YearlyPlan } from "@poynt/planner-validators";
import { headers } from "next/headers";

/**
 * Innholdskalender + abonnementsfeed (.ics).
 *
 * Årshjulet er måned/uke-basert (ingen konkrete datoer), så vi UTLEDER en dato
 * fra år + måned + uke. Det gir en «ekte» kalender og en .ics-feed uten å endre
 * datamodellen. Feeden signeres med BETTER_AUTH_SECRET så lenken kan deles med
 * en kalender-app (som ikke kan logge inn) uten å lekke andres data.
 */

const SECRET = process.env.BETTER_AUTH_SECRET ?? "dev-secret-change-me";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export interface CalendarDate {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
}

export interface FeedEvent {
  uid: string;
  date: CalendarDate;
  summary: string;
  description: string;
}

/**
 * Uke (1-5) i en måned → en konkret dag. Klamret til 28 så vi aldri lager en
 * ugyldig dato (februar). Holder innleggene spredt utover måneden.
 */
export function deriveDay(week: number): number {
  const raw = (Math.max(1, week) - 1) * 7 + 2;
  return Math.min(Math.max(raw, 1), 28);
}

/** Plukker dag-tallet ut av en norsk dato-streng, f.eks. «17. mai» → 17. */
function parseKeyDateDay(date: string | undefined): number {
  const match = date?.match(/\d{1,2}/);
  const day = match ? Number.parseInt(match[0], 10) : 15;
  return Math.min(Math.max(day, 1), 28);
}

/**
 * Gjør et lagret årshjul om til en flat liste kalenderhendelser. Tar med både
 * innholdsforslag (utledet dato fra uke) og merkedager (parset dag).
 */
export function planToEvents(
  plan: YearlyPlan,
  workspaceId: string,
  excludeIdeas?: Set<string>
): FeedEvent[] {
  const year = plan.year || new Date().getFullYear();
  const events: FeedEvent[] = [];

  for (const month of plan.months ?? []) {
    const m = month.month;
    if (!m) continue;

    month.posts?.forEach((post, i) => {
      if (!post?.idea) return;
      // Hopp over forslag som allerede er gjort om til et planlagt innlegg.
      if (excludeIdeas?.has(post.idea.trim().toLowerCase())) return;
      events.push({
        uid: `${workspaceId}-p-${m}-${post.week ?? 0}-${i}`,
        date: { year, month: m, day: deriveDay(post.week ?? 1) },
        summary: `${post.channel ? `${post.channel}: ` : ""}${post.idea}`,
        description: [post.type ? `Type: ${post.type}` : "", post.idea]
          .filter(Boolean)
          .join("\n"),
      });
    });

    month.keyDates?.forEach((kd, i) => {
      if (!kd?.event) return;
      events.push({
        uid: `${workspaceId}-k-${m}-${i}`,
        date: { year, month: m, day: parseKeyDateDay(kd.date) },
        summary: `📌 ${kd.event}`,
        description: kd.contentIdea ?? "",
      });
    });
  }

  return events;
}

/** Resultatformen vi trenger fra et lagret/planlagt innlegg. */
interface ScheduledResultLite {
  caption?: string;
  hashtags?: string[];
  channel?: string;
  idea?: string;
  scheduledDate?: string | null;
}

const withHashTag = (tag: string) => (tag.startsWith("#") ? tag : `#${tag}`);

/**
 * Gjør lagrede/planlagte innlegg om til kalenderhendelser (på sin faktiske
 * scheduledDate). Dette er det FAKTISKE innholdet, så det vises i feeden i
 * tillegg til (og foran) årshjul-forslagene.
 */
export function scheduledPostsToEvents(
  rows: { id: string; result: ScheduledResultLite | null }[],
  workspaceId: string
): FeedEvent[] {
  const events: FeedEvent[] = [];
  for (const row of rows) {
    const r = row.result;
    const match = r?.scheduledDate?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!r || !match) continue;
    const tags =
      r.hashtags && r.hashtags.length > 0
        ? r.hashtags.map(withHashTag).join(" ")
        : "";
    events.push({
      uid: `${workspaceId}-s-${row.id}`,
      date: {
        year: Number.parseInt(match[1], 10),
        month: Number.parseInt(match[2], 10),
        day: Number.parseInt(match[3], 10),
      },
      summary: `${r.channel ? `${r.channel}: ` : ""}${r.idea ?? r.caption?.split("\n")[0] ?? "Innlegg"}`,
      description: [r.caption, tags].filter(Boolean).join("\n\n"),
    });
  }
  return events;
}

/** Sett av idé-tekster fra planlagte innlegg — til dedup mot årshjul-forslag. */
export function scheduledIdeaSet(
  rows: { result: ScheduledResultLite | null }[]
): Set<string> {
  const set = new Set<string>();
  for (const row of rows) {
    const idea = row.result?.idea?.trim().toLowerCase();
    if (idea) set.add(idea);
  }
  return set;
}

const pad = (n: number) => String(n).padStart(2, "0");

const icsDate = (d: CalendarDate) => `${d.year}${pad(d.month)}${pad(d.day)}`;

/** Escaper tekst etter RFC 5545 (komma, semikolon, backslash, linjeskift). */
function escapeText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Brett linjer >75 oktetter (RFC 5545) — enkel variant på tegn-nivå. */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, 75));
  rest = rest.slice(75);
  while (rest.length > 74) {
    parts.push(` ${rest.slice(0, 74)}`);
    rest = rest.slice(74);
  }
  if (rest.length > 0) parts.push(` ${rest}`);
  return parts.join("\r\n");
}

/**
 * Bygger en gyldig VCALENDAR-tekst med heldags-hendelser. `stamp` er DTSTAMP
 * (settes av route-handleren — `new Date()` er greit i Next-runtime).
 */
export function buildICalendar(events: FeedEvent[], stamp: Date): string {
  const dtstamp = `${stamp
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "")}`;

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Poynt//Arshjul//NO",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Poynt – Innholdskalender",
    "X-WR-TIMEZONE:Europe/Oslo",
  ];

  for (const ev of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${ev.uid}@poynt.no`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART;VALUE=DATE:${icsDate(ev.date)}`,
      `SUMMARY:${escapeText(ev.summary)}`,
      ev.description ? `DESCRIPTION:${escapeText(ev.description)}` : "",
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");

  return lines
    .filter((l) => l !== "")
    .map(foldLine)
    .join("\r\n");
}

/** Signatur for en feed-lenke. Kort (32 tegn) for en penere URL. */
export function signWorkspace(workspaceId: string): string {
  return createHmac("sha256", SECRET)
    .update(workspaceId)
    .digest("hex")
    .slice(0, 32);
}

/** Konstant-tids-sammenligning av signaturen i en feed-lenke. */
export function verifyWorkspaceSig(workspaceId: string, sig: string): boolean {
  const expected = signWorkspace(workspaceId);
  if (sig.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

export interface CalendarFeedUrls {
  /** https:// — for «kopier lenke». */
  feedUrl: string;
  /** webcal:// — åpner abonnerings-dialogen i kalender-appen. */
  webcalUrl: string;
}

/**
 * Bygger den signerte feed-lenken for den innloggede brukerens arbeidsområde.
 * Server-only (leser sesjon + hemmelighet). Returnerer null om ingen sesjon /
 * arbeidsområde finnes.
 */
export async function getCalendarFeedUrls(): Promise<CalendarFeedUrls | null> {
  const headersList = await headers();
  const req = new Request("http://localhost", { headers: headersList });
  const session = await getSessionWithMembership(req);
  if (!session) return null;

  const membership = await db.query.plannerWorkspaceMember.findFirst({
    where: eq(plannerWorkspaceMember.userId, session.user.id),
  });
  if (!membership) return null;

  const sig = signWorkspace(membership.workspaceId);
  const path = `/on-poynt/api/calendar/${membership.workspaceId}/${sig}`;
  const feedUrl = `${BASE_URL}${path}`;
  const webcalUrl = feedUrl.replace(/^https?:\/\//, "webcal://");

  return { feedUrl, webcalUrl };
}
