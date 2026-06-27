import { z } from "zod";

/**
 * Innleggsvinkel (samme fire typene Native bruker). AI-en velger den som
 * passer post-idéen.
 */
export const postAngleTypes = [
  "produktfokusert",
  "kunnskap",
  "personlig",
  "aktualitet",
] as const;
export type PostAngle = (typeof postAngleTypes)[number];

export const postAngleLabels: Record<PostAngle, string> = {
  produktfokusert: "Produktfokusert",
  kunnskap: "Kunnskap",
  personlig: "Personlig",
  aktualitet: "Aktualitet",
};

/**
 * Input til drill-down: en konkret post-idé fra årshjulet → ett ferdig innlegg.
 */
export const generatePostRequestSchema = z.object({
  channel: z.string().min(1),
  idea: z.string().min(1),
  /** Innholdstype fra årshjulet (post/reel/artikkel …) — valgfri kontekst. */
  type: z.string().optional(),
  /** Måneden idéen hører til — for sesongkontekst. */
  monthName: z.string().optional(),
});
export type GeneratePostRequest = z.infer<typeof generatePostRequestSchema>;

/**
 * Skjema for det AI-en streamer (via `streamText` + `Output.object`). Strengt:
 * alle felter required. Felt-rekkefølgen er bevisst = visuell topp→bunn
 * (vinkel-badge → caption → hashtags → bilde-tips).
 */
export const generatedPostStreamSchema = z.object({
  postType: z.enum(postAngleTypes),
  caption: z.string(),
  hashtags: z.array(z.string()),
  /** Konkret anbefaling om hvilket bilde som passer (motiv, lys, vinkel). */
  imageTip: z.string(),
});
export type GeneratedPostStream = z.infer<typeof generatedPostStreamSchema>;

/**
 * Multi-kanal: ta ETT ferdig innlegg → tilpass det til andre kanaler. Hver
 * kanal har egne normer (LinkedIn ≠ Instagram ≠ TikTok), så vi skriver om
 * captionen per kanal i stedet for å kopiere den rått.
 */
export const adaptPostRequestSchema = z.object({
  /** Original-caption som skal tilpasses. */
  caption: z.string().min(1),
  /** Kanalen originalen ble skrevet for (så vi ikke gjenskaper den). */
  sourceChannel: z.string().min(1),
  /** Kanalene det skal lages varianter for. */
  targetChannels: z.array(z.string().min(1)).min(1),
  /** Opprinnelig idé — ekstra kontekst. */
  idea: z.string().optional(),
});
export type AdaptPostRequest = z.infer<typeof adaptPostRequestSchema>;

/**
 * Skjema AI-en streamer: én variant per ønsket kanal. Strengt (alle felter
 * required). Felt-rekkefølge = visuell topp→bunn (kanal → caption → hashtags).
 */
export const adaptedPostsStreamSchema = z.object({
  variants: z.array(
    z.object({
      channel: z.string(),
      caption: z.string(),
      hashtags: z.array(z.string()),
    })
  ),
});
export type AdaptedPostsStream = z.infer<typeof adaptedPostsStreamSchema>;
