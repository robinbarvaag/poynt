import { z } from "zod";

/**
 * Bedriftsstørrelse - bruker samme verdier som workspace profile
 */
export const companySizeTypes = ["solo", "small", "medium", "large"] as const;

export const companySizeLabels: Record<
  (typeof companySizeTypes)[number],
  string
> = {
  solo: "Enmannsbedrift",
  small: "2-10 ansatte",
  medium: "11-50 ansatte",
  large: "50+ ansatte",
};

/**
 * Tidsramme for planen
 */
export const timeframeTypes = ["3m", "6m", "12m"] as const;

export const timeframeLabels: Record<(typeof timeframeTypes)[number], string> =
  {
    "3m": "3 måneder (sprint)",
    "6m": "6 måneder (halvår)",
    "12m": "12 måneder (årsplan)",
  };

/**
 * Budsjett-nivå
 */
export const budgetTypes = ["none", "low", "medium", "high"] as const;

export const budgetLabels: Record<(typeof budgetTypes)[number], string> = {
  none: "Ingen / kun tid",
  low: "Lite (0-5.000 kr/mnd)",
  medium: "Medium (5-20.000 kr/mnd)",
  high: "Stort (20.000+ kr/mnd)",
};

/**
 * Hovedmål - gjenbruker konseptet fra channel-guide
 */
export const marketingGoalTypes = [
  "leads",
  "sales",
  "awareness",
  "recruitment",
  "authority",
] as const;

export const marketingGoalLabels: Record<
  (typeof marketingGoalTypes)[number],
  string
> = {
  leads: "Få flere leads/henvendelser",
  sales: "Øke direkte salg",
  awareness: "Bygge kjennskap og merkevare",
  recruitment: "Tiltrekke talenter",
  authority: "Bli ekspert/thought leader i bransjen",
};

/**
 * Eksisterende markedsaktiviteter
 */
export const existingActivityTypes = [
  "linkedin",
  "instagram",
  "facebook",
  "newsletter",
  "blog",
  "podcast",
  "youtube",
  "ads",
  "events",
  "none",
] as const;

export const existingActivityLabels: Record<
  (typeof existingActivityTypes)[number],
  string
> = {
  linkedin: "Poster på LinkedIn",
  instagram: "Aktiv på Instagram",
  facebook: "Facebook-side/gruppe",
  newsletter: "Sender nyhetsbrev",
  blog: "Skriver blogginnlegg",
  podcast: "Har podcast",
  youtube: "YouTube-kanal",
  ads: "Kjører annonser",
  events: "Holder foredrag/webinarer",
  none: "Ingen fast aktivitet",
};

/**
 * Zod schema for markedsplan-forespørsel
 */
export const marketingPlanRequestSchema = z.object({
  // Obligatorisk
  industry: z
    .string()
    .min(1, "Beskriv hvilken bransje du jobber i")
    .max(200, "Maks 200 tegn"),
  companySize: z.enum(companySizeTypes, {
    error: "Velg bedriftsstørrelse",
  }),
  mainGoal: z.enum(marketingGoalTypes, {
    error: "Velg ditt hovedmål",
  }),
  timeframe: z.enum(timeframeTypes, {
    error: "Velg tidsramme for planen",
  }),

  // Valgfritt
  budget: z.enum(budgetTypes).optional(),
  existingActivities: z.array(z.enum(existingActivityTypes)).optional(),
  targetAudienceDescription: z
    .string()
    .max(500, "Maks 500 tegn")
    .optional()
    .or(z.literal("")),
  competitors: z
    .string()
    .max(300, "Maks 300 tegn")
    .optional()
    .or(z.literal("")),
});

export type MarketingPlanRequest = z.infer<typeof marketingPlanRequestSchema>;

/**
 * Kanal-aktivitet i planen
 */
export const channelActivitySchema = z.object({
  channel: z.string(),
  frequency: z.string(),
  activities: z.array(z.string()),
  priority: z.enum(["high", "medium", "low"]),
  expectedImpact: z.string().optional(),
  potentialChallenges: z.array(z.string()).optional(),
  resourcesNeeded: z.string().optional(),
  successMetrics: z.array(z.string()).optional(),
});

export type ChannelActivity = z.infer<typeof channelActivitySchema>;

/**
 * Måned i tidslinjen
 */
export const monthPlanSchema = z.object({
  month: z.number().min(1).max(12),
  monthName: z.string(),
  focus: z.string(),
  tasks: z.array(z.string()),
});

export type MonthPlan = z.infer<typeof monthPlanSchema>;

/**
 * Ukentlig oppgave
 */
export const weeklyTaskSchema = z.object({
  day: z.string(),
  task: z.string(),
  duration: z.string(),
});

export type WeeklyTask = z.infer<typeof weeklyTaskSchema>;

/**
 * Komplett markedsplan
 */
export const marketingPlanSchema = z.object({
  summary: z.string(),
  reasoning: z.string().optional(),
  channels: z.array(channelActivitySchema),
  timeline: z.array(monthPlanSchema),
  weeklyRoutine: z.array(weeklyTaskSchema),
  quickWins: z.array(z.string()),
  tips: z.array(z.string()),
});

export type MarketingPlan = z.infer<typeof marketingPlanSchema>;

/**
 * Skjema for det AI-en streamer (via `streamText` + `Output.object`).
 *
 * OpenAIs strenge structured-output krever at ALLE felter ligger i `required`.
 * Valgfrie felter må derfor være `.nullable()` (påkrevd, men kan være null),
 * ikke `.optional()`. UI-en behandler null som «ikke oppgitt» (null er falsy).
 *
 * FELT-REKKEFØLGEN ER BEVISST: modellen genererer feltene i denne rekkefølgen,
 * og under streaming fylles UI-et inn i samme rekkefølge topp→bunn
 * (oppsummering → vurdering → kanaler → tidslinje → ukesrutine → quick wins →
 * tips), så innholdet ikke streamer inn «over» noe som alt er vist.
 */
const streamChannelActivitySchema = z.object({
  channel: z.string(),
  frequency: z.string(),
  priority: z.enum(["high", "medium", "low"]),
  activities: z.array(z.string()),
  expectedImpact: z.string().nullable(),
  resourcesNeeded: z.string().nullable(),
  potentialChallenges: z.array(z.string()).nullable(),
  successMetrics: z.array(z.string()).nullable(),
});

const streamMonthPlanSchema = z.object({
  month: z.number(),
  monthName: z.string(),
  focus: z.string(),
  tasks: z.array(z.string()),
});

const streamWeeklyTaskSchema = z.object({
  day: z.string(),
  task: z.string(),
  duration: z.string(),
});

export const marketingPlanStreamSchema = z.object({
  summary: z.string(),
  reasoning: z.string(),
  channels: z.array(streamChannelActivitySchema),
  timeline: z.array(streamMonthPlanSchema),
  weeklyRoutine: z.array(streamWeeklyTaskSchema),
  quickWins: z.array(z.string()),
  tips: z.array(z.string()),
});

export type MarketingPlanStream = z.infer<typeof marketingPlanStreamSchema>;

/**
 * Response fra AI
 */
export const marketingPlanResponseSchema = z.object({
  success: z.boolean(),
  plan: marketingPlanSchema.optional(),
  error: z.string().optional(),
});

export type MarketingPlanResponse = z.infer<typeof marketingPlanResponseSchema>;
