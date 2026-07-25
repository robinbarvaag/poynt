"use client";

import { cn } from "@poynt/ui";
import type { ReactNode } from "react";

/** Delte småhjelpere for fellesskapet (chat + innlegg). */

export const timeFmt = new Intl.DateTimeFormat("nb-NO", {
  hour: "2-digit",
  minute: "2-digit",
});

const dayFmt = new Intl.DateTimeFormat("nb-NO", {
  day: "numeric",
  month: "long",
});

export function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function sameDay(a: string | Date, b: string | Date): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

export function formatDayLabel(value: string | Date): string {
  const d = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (sameDay(d, today)) return "I dag";
  if (sameDay(d, yesterday)) return "I går";
  return dayFmt.format(d);
}

/** «for 5 min siden»-aktig kort relativ tid for innlegg. */
export function relativeTime(value: string | Date): string {
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "nå nettopp";
  if (mins < 60) return `${mins} min siden`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} t siden`;
  return `${formatDayLabel(value)} kl. ${timeFmt.format(new Date(value))}`;
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Faste, fargerike avatar-flater fra merkepaletten — deterministisk per id.
const AVATAR_COLORS = [
  "bg-accent-1 text-foreground",
  "bg-accent-2 text-foreground",
  "bg-accent-3 text-foreground",
  "bg-accent-4 text-foreground",
  "bg-yellow-green text-foreground",
  "bg-bright-pink text-foreground",
];
export function avatarColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length] as string;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Uthever `@Navn` for kjente medlemmer i tekst. `onPrimary` = teksten står på
 * en primærfarget flate (egen boble), der grønn-på-grønn ville blitt usynlig.
 */
export function renderBody(
  text: string,
  memberNames: string[],
  { onPrimary = false }: { onPrimary?: boolean } = {}
): ReactNode {
  if (memberNames.length === 0) return text;
  const names = [...memberNames].sort((a, b) => b.length - a.length);
  const re = new RegExp(`@(${names.map(escapeRegExp).join("|")})`, "g");
  const out: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null = re.exec(text);
  let key = 0;
  while (match !== null) {
    if (match.index > last) out.push(text.slice(last, match.index));
    out.push(
      <span
        key={`m-${key}`}
        className={cn(
          "rounded px-0.5 font-medium",
          onPrimary
            ? "bg-primary-foreground/25 text-primary-foreground"
            : "bg-primary/15 text-primary"
        )}
      >
        {match[0]}
      </span>
    );
    key += 1;
    last = match.index + match[0].length;
    match = re.exec(text);
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Synlig reaksjons-pille. */
export function ReactionChip({
  emoji,
  count,
  mine,
  onClick,
}: {
  emoji: string;
  count: number;
  mine: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
        mine
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border bg-card text-foreground hover:bg-muted"
      )}
    >
      <span className="text-sm leading-none">{emoji}</span>
      <span className="font-semibold">{count}</span>
    </button>
  );
}
