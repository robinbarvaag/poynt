import { z } from "zod";

export const podcastToContentRequestSchema = z.object({
  transcript: z.string().min(1, "Transkripsjon kan ikke være tom"),
  generateBlogPost: z.boolean().default(true),
  generateSocialPosts: z.boolean().default(true),
  generateChapters: z.boolean().default(true),
  generateClipPlan: z.boolean().default(true),
  generateCarousels: z.boolean().default(true),
  generateNewsletter: z.boolean().default(true),
  generateQuotes: z.boolean().default(true),
  generateKeyPoints: z.boolean().default(true),
});

export type PodcastToContentRequest = z.infer<
  typeof podcastToContentRequestSchema
>;

/**
 * Strukturert output-schema for podkast-gjenbruk. Seksjonane er `.nullable()`
 * (ikkje `.optional()`): OpenAIs strict structured output krev at ALLE felt står
 * i `required`, så «valgfritt» må uttrykkast som «kan vera null». Modellen fyller
 * berre dei seksjonane brukaren har bedt om og set resten til null (styrt via
 * prompten). Matcher AI SDK v6-mønsteret (`Output.object`) i resten av verktøyene.
 */
export const podcastContentSchema = z.object({
  keyPoints: z.array(z.string()).nullable(),
  blogPost: z
    .object({
      title: z.string(),
      content: z.string(),
    })
    .nullable(),
  socialPosts: z
    .object({
      linkedin: z.string(),
      instagram: z.string(),
      twitter: z.string(),
    })
    .nullable(),
  chapters: z
    .array(
      z.object({
        timestamp: z.string(),
        title: z.string(),
      })
    )
    .nullable(),
  clipPlan: z
    .array(
      z.object({
        timestamp: z.string(),
        title: z.string(),
        hook: z.string(),
        reason: z.string(),
      })
    )
    .nullable(),
  carousels: z
    .array(
      z.object({
        title: z.string(),
        slides: z.array(z.string()),
      })
    )
    .nullable(),
  newsletter: z
    .object({
      subject: z.string(),
      body: z.string(),
    })
    .nullable(),
  quotes: z.array(z.string()).nullable(),
});

export type PodcastContent = z.infer<typeof podcastContentSchema>;

/**
 * Response-typen til klienten bruker valgfrie felt for ergonomi – libben mappar
 * `null` frå modellen til `undefined` før retur.
 */
export interface PodcastToContentResponse {
  success: boolean;
  error?: string;
  keyPoints?: string[];
  blogPost?: { title: string; content: string };
  socialPosts?: { linkedin: string; instagram: string; twitter: string };
  chapters?: Array<{ timestamp: string; title: string }>;
  clipPlan?: Array<{
    timestamp: string;
    title: string;
    hook: string;
    reason?: string;
  }>;
  carousels?: Array<{ title: string; slides: string[] }>;
  newsletter?: { subject: string; body: string };
  quotes?: string[];
}
