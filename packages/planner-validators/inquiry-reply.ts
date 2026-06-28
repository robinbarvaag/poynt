import { z } from "zod";

/**
 * «Svar på henvendelser» — lim inn en kundehenvendelse, Google-/Facebook-
 * anmeldelse eller klage, og få 2-3 ferdige svarvarianter i bedriftens stemme.
 */

export const inquirySources = [
  "google_review",
  "facebook",
  "email",
  "dm",
  "other",
] as const;

export type InquirySource = (typeof inquirySources)[number];

export const inquirySourceLabels: Record<InquirySource, string> = {
  google_review: "Google-anmeldelse",
  facebook: "Facebook",
  email: "E-post",
  dm: "DM / melding",
  other: "Annet",
};

export const replySentiments = ["positive", "neutral", "negative"] as const;

export type ReplySentiment = (typeof replySentiments)[number];

export const replySentimentLabels: Record<ReplySentiment, string> = {
  positive: "Positiv",
  neutral: "Nøytral",
  negative: "Negativ / misfornøyd",
};

export const inquiryGoals = [
  "thank",
  "resolve",
  "answer",
  "more_info",
] as const;

export type InquiryGoal = (typeof inquiryGoals)[number];

export const inquiryGoalLabels: Record<InquiryGoal, string> = {
  thank: "Takke og bygge relasjon",
  resolve: "Beklage og løse",
  answer: "Svare på spørsmål og invitere videre",
  more_info: "Be om mer informasjon",
};

export const inquiryReplyRequestSchema = z.object({
  incomingMessage: z
    .string()
    .min(5, "Lim inn meldingen du vil svare på")
    .max(2000, "Maks 2000 tegn"),
  source: z.enum(inquirySources, {
    required_error: "Velg hvor meldingen kom fra",
  }),
  sentiment: z.enum(replySentiments).optional(),
  goal: z.enum(inquiryGoals).optional(),
  extraContext: z
    .string()
    .max(500, "Maks 500 tegn")
    .optional()
    .or(z.literal("")),
});

export type InquiryReplyRequest = z.infer<typeof inquiryReplyRequestSchema>;

/**
 * Strøm-skjema. Som de andre verktøyene: valgfrie felter er `.nullable()` (ikke
 * `.optional()`) fordi streng structured-output krever at ALLE felter er med.
 */
const inquiryVariantSchema = z.object({
  label: z.string(),
  tone: z.string(),
  text: z.string(),
});

export type InquiryVariant = z.infer<typeof inquiryVariantSchema>;

export const inquiryReplyStreamSchema = z.object({
  detectedSentiment: z.enum(replySentiments),
  summary: z.string(),
  variants: z.array(inquiryVariantSchema),
  tips: z.array(z.string()),
});

export type InquiryReplyStream = z.infer<typeof inquiryReplyStreamSchema>;
