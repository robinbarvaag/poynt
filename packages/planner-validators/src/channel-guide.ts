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
  "mixed",
] as const;

export const strengthLabels: Record<(typeof strengthTypes)[number], string> = {
  writing: "Skrive (tekst, artikler)",
  speaking: "Snakke (video, podcast)",
  visual: "Visuelt (design, foto)",
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
 * Kanal-anbefaling (utvidet med mer info)
 */
export const channelRecommendationSchema = z.object({
  name: z.string(),
  matchPercent: z.number().min(0).max(100),
  reason: z.string(),
  whyNotHigher: z.string().optional(),
  timeToResults: z.string().optional(),
  weeklyTimeNeeded: z.string().optional(),
  idealFor: z.array(z.string()).optional(),
  challengingIf: z.array(z.string()).optional(),
});

export type ChannelRecommendation = z.infer<typeof channelRecommendationSchema>;

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
