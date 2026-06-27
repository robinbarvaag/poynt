import { z } from "zod";

/**
 * Kanaler for publisering
 */
export const publishChannelTypes = [
  "linkedin",
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
  "newsletter",
  "blog",
  "podcast",
] as const;

export const publishChannelLabels: Record<
  (typeof publishChannelTypes)[number],
  string
> = {
  linkedin: "LinkedIn",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  newsletter: "Nyhetsbrev",
  blog: "Blogg",
  podcast: "Podcast",
};

/**
 * Publiseringsfrekvens
 */
export const frequencyTypes = [
  "daily",
  "few-weekly",
  "weekly",
  "biweekly",
  "monthly",
] as const;

export const frequencyLabels: Record<(typeof frequencyTypes)[number], string> =
  {
    daily: "Daglig",
    "few-weekly": "2-3 ganger i uken",
    weekly: "Ukentlig",
    biweekly: "Annenhver uke",
    monthly: "Månedlig",
  };

/**
 * Målgruppe-type
 */
export const audienceTypes = ["b2b", "b2c", "both"] as const;

export const audienceLabels: Record<(typeof audienceTypes)[number], string> = {
  b2b: "Bedrifter (B2B)",
  b2c: "Forbrukere (B2C)",
  both: "Begge deler",
};

/**
 * Tone of voice
 */
export const contentToneTypes = [
  "professional",
  "casual",
  "inspiring",
  "educational",
] as const;

export const contentToneLabels: Record<
  (typeof contentToneTypes)[number],
  string
> = {
  professional: "Profesjonell og seriøs",
  casual: "Uformell og personlig",
  inspiring: "Inspirerende og motiverende",
  educational: "Lærerik og informativ",
};

/**
 * Zod schema for årshjul-forespørsel
 */
export const yearlyPlannerRequestSchema = z.object({
  // Obligatorisk
  industry: z
    .string()
    .min(1, "Beskriv hvilken bransje du jobber i")
    .max(200, "Maks 200 tegn"),
  channels: z.array(z.enum(publishChannelTypes)).min(1, "Velg minst én kanal"),
  frequency: z.enum(frequencyTypes, {
    required_error: "Velg publiseringsfrekvens",
  }),
  audience: z.enum(audienceTypes, {
    required_error: "Velg målgruppe",
  }),

  // Valgfritt
  tone: z.enum(contentToneTypes).optional(),
  importantDates: z
    .string()
    .max(500, "Maks 500 tegn")
    .optional()
    .or(z.literal("")),
  focusTopics: z
    .string()
    .max(500, "Maks 500 tegn")
    .optional()
    .or(z.literal("")),
});

export type YearlyPlannerRequest = z.infer<typeof yearlyPlannerRequestSchema>;

/**
 * Innholdsforslag for en måned
 */
export const monthContentSchema = z.object({
  month: z.number().min(1).max(12),
  monthName: z.string(),
  theme: z.string(),
  posts: z.array(
    z.object({
      week: z.number().min(1).max(5),
      channel: z.string(),
      idea: z.string(),
      type: z.string(), // "post", "story", "reel", "article", etc.
    })
  ),
  keyDates: z.array(
    z.object({
      date: z.string(),
      event: z.string(),
      contentIdea: z.string(),
    })
  ),
  tips: z.array(z.string()),
});

export type MonthContent = z.infer<typeof monthContentSchema>;

/**
 * Komplett årsplan
 */
export const yearlyPlanSchema = z.object({
  summary: z.string(),
  year: z.number(),
  months: z.array(monthContentSchema),
  overallTips: z.array(z.string()),
});

export type YearlyPlan = z.infer<typeof yearlyPlanSchema>;

/**
 * Skjema for det AI-en streamer (via `streamText` + `Output.object`). Alle
 * felter er påkrevd (årshjulet har ingen valgfrie felter), uten `.min/.max`-
 * refinements som OpenAIs strenge structured-output ikke alltid mapper.
 *
 * FELT-REKKEFØLGEN ER BEVISST: under streaming fylles UI-et inn topp→bunn
 * (oppsummering → måneder → generelle tips).
 */
const streamMonthContentSchema = z.object({
  month: z.number(),
  monthName: z.string(),
  theme: z.string(),
  posts: z.array(
    z.object({
      week: z.number(),
      channel: z.string(),
      idea: z.string(),
      type: z.string(),
    })
  ),
  keyDates: z.array(
    z.object({
      date: z.string(),
      event: z.string(),
      contentIdea: z.string(),
    })
  ),
  tips: z.array(z.string()),
});

export const yearlyPlanStreamSchema = z.object({
  summary: z.string(),
  year: z.number(),
  months: z.array(streamMonthContentSchema),
  overallTips: z.array(z.string()),
});

export type YearlyPlanStream = z.infer<typeof yearlyPlanStreamSchema>;

/**
 * Response fra AI
 */
export const yearlyPlannerResponseSchema = z.object({
  success: z.boolean(),
  plan: yearlyPlanSchema.optional(),
  error: z.string().optional(),
});

export type YearlyPlannerResponse = z.infer<typeof yearlyPlannerResponseSchema>;
