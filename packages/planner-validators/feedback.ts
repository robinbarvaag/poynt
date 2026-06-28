import { z } from "zod";

/**
 * Tilbakemelding / ønsker fra medlemmer. Privat innsending: medlemmet sender
 * inn, ser sine egne og statusen admin setter. Ingen offentlig tavle (ennå).
 */

export const feedbackCategories = [
  "challenge",
  "feature",
  "improvement",
  "other",
] as const;

export type FeedbackCategory = (typeof feedbackCategories)[number];

export const feedbackCategoryLabels: Record<FeedbackCategory, string> = {
  challenge: "Utfordring i hverdagen",
  feature: "Ønsket funksjon",
  improvement: "Forbedring",
  other: "Annet",
};

export const feedbackStatuses = [
  "received",
  "reviewing",
  "planned",
  "resolved",
  "declined",
] as const;

export type FeedbackStatus = (typeof feedbackStatuses)[number];

export const feedbackStatusLabels: Record<FeedbackStatus, string> = {
  received: "Mottatt",
  reviewing: "Vurderes",
  planned: "Planlagt",
  resolved: "Løst",
  declined: "Takk, men ikke nå",
};

export const createFeedbackSchema = z.object({
  category: z.enum(feedbackCategories, { required_error: "Velg en kategori" }),
  title: z.string().min(3, "Gi en kort tittel").max(140, "Maks 140 tegn"),
  description: z
    .string()
    .min(5, "Beskriv litt mer så vi forstår behovet")
    .max(4000, "Maks 4000 tegn"),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;

export const updateFeedbackStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(feedbackStatuses),
  adminResponse: z
    .string()
    .max(4000, "Maks 4000 tegn")
    .optional()
    .or(z.literal("")),
});

export type UpdateFeedbackStatusInput = z.infer<
  typeof updateFeedbackStatusSchema
>;
