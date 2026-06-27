/**
 * Delt grunnlag for «planlagte innlegg» — innlegg som ligger på en konkret dato
 * i innholdskalenderen. Lagres i plannerToolResult (toolId nedenfor), så vi
 * trenger ingen ny tabell. Ren modul (ingen React/trpc/ui) så den kan brukes
 * både i klient-komponenter og i den server-only .ics-feeden.
 */

/** toolId planlagte innlegg lagres under. */
export const SCHEDULED_POST_TOOL_ID = "generated-post";

export type PostSource = "ai" | "manual";

/** Det vi lagrer i `result` på et planlagt innlegg. */
export interface ScheduledPostResult {
  caption?: string;
  hashtags?: string[];
  imageTip?: string | null;
  channel?: string;
  idea?: string;
  monthName?: string | null;
  /** ISO-dato «YYYY-MM-DD» — hvor i kalenderen innlegget ligger. */
  scheduledDate?: string | null;
  postType?: string | null;
  source?: PostSource;
}

export interface ScheduledPost {
  id: string;
  createdAt: string | Date;
  result: ScheduledPostResult | null;
}

/* ------------------------------------------------------------------ */
/* Kanal-farger (funksjonell adskillelse, dempede toner)              */
/* ------------------------------------------------------------------ */

export type ChannelKey =
  | "linkedin"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "newsletter"
  | "blog"
  | "podcast"
  | "other";

export interface ChannelMeta {
  label: string;
  /** Liten farget prikk (kalender-brikke). */
  dot: string;
  /** Bakgrunn + tekst for en brikke/pill. */
  chip: string;
}

export const CHANNEL_META: Record<ChannelKey, ChannelMeta> = {
  linkedin: {
    label: "LinkedIn",
    dot: "bg-sky-500",
    chip: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20",
  },
  instagram: {
    label: "Instagram",
    dot: "bg-rose-500",
    chip: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
  },
  facebook: {
    label: "Facebook",
    dot: "bg-blue-600",
    chip: "bg-blue-600/10 text-blue-700 dark:text-blue-300 border-blue-600/20",
  },
  tiktok: {
    label: "TikTok",
    dot: "bg-zinc-700 dark:bg-zinc-300",
    chip: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/20",
  },
  youtube: {
    label: "YouTube",
    dot: "bg-red-600",
    chip: "bg-red-600/10 text-red-700 dark:text-red-300 border-red-600/20",
  },
  newsletter: {
    label: "Nyhetsbrev",
    dot: "bg-amber-500",
    chip: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
  },
  blog: {
    label: "Blogg",
    dot: "bg-violet-500",
    chip: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20",
  },
  podcast: {
    label: "Podcast",
    dot: "bg-emerald-500",
    chip: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  },
  other: {
    label: "Annet",
    dot: "bg-primary",
    chip: "bg-primary/10 text-primary border-primary/20",
  },
};

/** Liste over kanaler man kan velge når man oppretter et innlegg. */
export const SELECTABLE_CHANNELS: ChannelKey[] = [
  "linkedin",
  "instagram",
  "facebook",
  "tiktok",
  "newsletter",
  "blog",
];

/** Matcher en fri kanal-streng (fra årshjulet) mot en kjent kanal-nøkkel. */
export function normalizeChannel(channel: string | undefined): ChannelKey {
  const c = (channel ?? "").toLowerCase();
  if (c.includes("linkedin")) return "linkedin";
  if (c.includes("insta")) return "instagram";
  if (c.includes("face")) return "facebook";
  if (c.includes("tiktok") || c.includes("tik tok")) return "tiktok";
  if (c.includes("youtube") || c.includes("you tube")) return "youtube";
  if (c.includes("nyhet") || c.includes("epost") || c.includes("e-post"))
    return "newsletter";
  if (c.includes("blogg") || c.includes("blog") || c.includes("artik"))
    return "blog";
  if (c.includes("podcast") || c.includes("podkast")) return "podcast";
  return "other";
}

export function channelMeta(channel: string | undefined): ChannelMeta {
  return CHANNEL_META[normalizeChannel(channel)];
}

/* ------------------------------------------------------------------ */
/* Bedrifts-identitet (navn + logo) til forhåndsvisningen             */
/* ------------------------------------------------------------------ */

export interface BusinessIdentity {
  name: string;
  /** Logo-URL (favicon utledet fra nettsiden) — null = bruk initialer. */
  logoUrl: string | null;
}

/** Utleder en logo (favicon) fra bedriftens nettside via Googles favicon-tjeneste. */
export function faviconFor(website: string | null | undefined): string | null {
  if (!website) return null;
  try {
    const url = website.startsWith("http") ? website : `https://${website}`;
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Dato-utledning (samme i kalender, drilldown og .ics-feed)         */
/* ------------------------------------------------------------------ */

/** Uke (1-5) i en måned → en konkret dag. Klamret til 28 (gyldig i februar). */
export function deriveDay(week: number): number {
  const raw = (Math.max(1, week) - 1) * 7 + 2;
  return Math.min(Math.max(raw, 1), 28);
}

const pad = (n: number) => String(n).padStart(2, "0");

/** {år, måned 1-12, dag} → «YYYY-MM-DD». */
export function toISODate(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** Utledet ISO-dato for et årshjul-forslag (år + måned + uke). */
export function deriveISODate(
  year: number,
  month: number,
  week: number
): string {
  return toISODate(year, month, deriveDay(week));
}

/**
 * Fjerner en avsluttende blokk med hashtags fra en caption — vi viser hashtags
 * i et eget felt, så når modellen også legger dem på slutten av teksten blir de
 * ellers stående dobbelt.
 */
export function stripTrailingHashtags(caption: string): string {
  return caption.replace(/\s*(?:#[^\s#]+(?:\s+|$))+$/u, "").trimEnd();
}

/** «YYYY-MM-DD» → {year, month, day} (eller null). */
export function parseISODate(
  iso: string | null | undefined
): { year: number; month: number; day: number } | null {
  if (!iso) return null;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return {
    year: Number.parseInt(m[1], 10),
    month: Number.parseInt(m[2], 10),
    day: Number.parseInt(m[3], 10),
  };
}
