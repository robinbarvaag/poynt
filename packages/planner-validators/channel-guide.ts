import { z } from "zod";

/**
 * Målgruppe-typer
 */
export const targetAudienceTypes = ["b2b", "b2c", "both"] as const;

export const targetAudienceLabels: Record<
  (typeof targetAudienceTypes)[number],
  string
> = {
  b2b: "Bedrifter (B2B)",
  b2c: "Forbrukere (B2C)",
  both: "Begge deler",
};

/**
 * Hovedmål
 */
export const mainGoalTypes = [
  "leads",
  "sales",
  "awareness",
  "recruitment",
] as const;

export const mainGoalLabels: Record<(typeof mainGoalTypes)[number], string> = {
  leads: "Få flere leads/henvendelser",
  sales: "Direkte salg",
  awareness: "Bygge kjennskap og merkevare",
  recruitment: "Rekruttering",
};

/**
 * Ukentlig tid tilgjengelig
 */
export const weeklyTimeTypes = ["1-2h", "3-5h", "5h+"] as const;

export const weeklyTimeLabels: Record<
  (typeof weeklyTimeTypes)[number],
  string
> = {
  "1-2h": "1-2 timer i uken",
  "3-5h": "3-5 timer i uken",
  "5h+": "Mer enn 5 timer i uken",
};

/**
 * Styrker
 */
export const strengthTypes = [
  "writing",
  "speaking",
  "visual",
  "showcase",
  "expertise",
  "relationships",
  "handson",
  "mixed",
] as const;

export const strengthLabels: Record<(typeof strengthTypes)[number], string> = {
  writing: "Skrive (tekst, artikler)",
  speaking: "Snakke (video, podcast)",
  visual: "Visuelt (design, foto)",
  showcase: "Vise frem arbeid og resultater (før/etter, prosjekter)",
  expertise: "Fagkunnskap og rådgivning",
  relationships: "Kunderelasjoner og nettverk",
  handson: "Praktisk og hands-on (mindre glad i å skrive/filme)",
  mixed: "Kombinasjon av flere",
};

/**
 * Tidligere kanaler
 */
export const previousChannelTypes = [
  "linkedin",
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
  "email",
  "podcast",
  "none",
] as const;

export const previousChannelLabels: Record<
  (typeof previousChannelTypes)[number],
  string
> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  email: "E-post/Nyhetsbrev",
  podcast: "Podcast",
  none: "Ingen erfaring",
};

/**
 * Zod schema for kanalveileder-forespørsel
 */
export const channelGuideRequestSchema = z.object({
  industryId: z.string().min(1, "Velg hvilken bransje du jobber i"),
  targetAudience: z.enum(targetAudienceTypes, {
    required_error: "Velg din målgruppe",
  }),
  mainGoal: z.enum(mainGoalTypes, {
    required_error: "Velg ditt hovedmål",
  }),
  weeklyTime: z.enum(weeklyTimeTypes, {
    required_error: "Velg hvor mye tid du har tilgjengelig",
  }),
  strengths: z.enum(strengthTypes, {
    required_error: "Velg dine styrker",
  }),
  previousChannels: z.array(z.enum(previousChannelTypes)).optional(),
  previousExperience: z
    .string()
    .max(500, "Maks 500 tegn")
    .optional()
    .or(z.literal("")),
});

export type ChannelGuideRequest = z.infer<typeof channelGuideRequestSchema>;

/**
 * Match-nivå — erstatter den falske %-presisjonen (85 %, 80 % …) med tre
 * ærlige nivåer. AI-en kan ikke vite en eksakt prosent; nivå er mer redelig.
 */
export const channelMatchLevels = ["strong", "good", "possible"] as const;
export type ChannelMatchLevel = (typeof channelMatchLevels)[number];

export const channelMatchLevelLabels: Record<ChannelMatchLevel, string> = {
  strong: "Sterk match",
  good: "God match",
  possible: "Mulig match",
};

/**
 * Kanal-anbefaling (utvidet med mer info).
 *
 * `matchLevel` er det nye, redelige feltet. `matchPercent` beholdes som
 * valgfritt kun for bakoverkompabilitet med tidligere lagrede resultater —
 * nye genereringer bruker `matchLevel`.
 */
export const channelRecommendationSchema = z.object({
  name: z.string(),
  matchLevel: z.enum(channelMatchLevels).optional(),
  matchPercent: z.number().min(0).max(100).optional(),
  reason: z.string(),
  whyNotHigher: z.string().optional(),
  timeToResults: z.string().optional(),
  weeklyTimeNeeded: z.string().optional(),
  idealFor: z.array(z.string()).optional(),
  challengingIf: z.array(z.string()).optional(),
});

export type ChannelRecommendation = z.infer<typeof channelRecommendationSchema>;

/**
 * Utleder match-nivå fra enten det nye `matchLevel`-feltet eller en avlegs
 * lagret `matchPercent`, så gamle og nye resultater vises likt.
 */
export function resolveChannelMatchLevel(rec: {
  matchLevel?: ChannelMatchLevel | null;
  matchPercent?: number | null;
}): ChannelMatchLevel {
  if (rec.matchLevel) return rec.matchLevel;
  const percent = rec.matchPercent ?? 0;
  if (percent >= 80) return "strong";
  if (percent >= 60) return "good";
  return "possible";
}

/**
 * Skjema for det AI-en streamer (via `streamText` + `Output.object`). Strengere
 * enn lagrings-skjemaet: `matchLevel` er påkrevd, og vi ber om `nextSteps` —
 * de konkrete tingene brukeren bør gjøre denne uken for toppkanalen.
 *
 * FELT-REKKEFØLGEN ER BEVISST: modellen genererer feltene i denne rekkefølgen,
 * og under streaming fylles UI-et inn i samme rekkefølge. Den matcher visningen
 * topp→bunn (hero med kanal+begrunnelse → neste steg → samlet vurdering), så
 * innholdet ikke streamer inn «over» noe som alt er vist.
 */
// OpenAIs strenge structured-output krever at ALLE felter ligger i `required`.
// Valgfrie felter må derfor være `.nullable()` (påkrevd, men kan være null),
// ikke `.optional()`. UI-en behandler null som «ikke oppgitt» (null er falsy).
const generatedChannelSchema = z.object({
  name: z.string(),
  matchLevel: z.enum(channelMatchLevels),
  reason: z.string(),
  whyNotHigher: z.string().nullable(),
  timeToResults: z.string().nullable(),
  weeklyTimeNeeded: z.string().nullable(),
  idealFor: z.array(z.string()).nullable(),
  challengingIf: z.array(z.string()).nullable(),
});

export const channelGuideStreamSchema = z.object({
  channels: z.array(generatedChannelSchema),
  nextSteps: z.array(z.string()),
  reasoning: z.string(),
});

export type ChannelGuideStream = z.infer<typeof channelGuideStreamSchema>;

/**
 * Response fra AI
 */
export const channelGuideResponseSchema = z.object({
  success: z.boolean(),
  reasoning: z.string().optional(), // Overordnet begrunnelse for anbefalingene
  channels: z.array(channelRecommendationSchema).optional(),
  error: z.string().optional(),
});

export type ChannelGuideResponse = z.infer<typeof channelGuideResponseSchema>;
