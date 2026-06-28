import {
  type PodcastToContentRequest,
  type PodcastToContentResponse,
  podcastContentSchema,
} from "@poynt/planner-validators";
import { Output, streamText } from "ai";
import { utilityModel } from "./models";
import { resolveSystemPrompt } from "./prompt-template";

/**
 * Gjenbruker éin podkast-transkripsjon til mange ferdige innhaldsbiter
 * (blogg, sosialt, kapittel, klipp-plan, carousels, nyhetsbrev, sitat).
 *
 * Bruker det stabile `streamText` + `Output.object`-API-et som resten av
 * verktøyene – ingen `JSON.parse`, schema-validert output. Modellen veljast
 * sentralt i `models.ts`, så bytte til Claude er ein ett-linjes endring der.
 *
 * Schemaet har alle seksjonar valgfrie; vi instruerer modellen om å fylla
 * berre dei brukaren har bedt om via avkryssingsboksane.
 */
export async function generatePodcastContent(
  input: PodcastToContentRequest
): Promise<PodcastToContentResponse> {
  const {
    transcript,
    generateBlogPost,
    generateSocialPosts,
    generateChapters,
    generateClipPlan,
    generateCarousels,
    generateNewsletter,
    generateQuotes,
    generateKeyPoints,
  } = input;

  const wanted: string[] = [];
  if (generateKeyPoints)
    wanted.push(
      '- "keyPoints": liste med 3-6 korte kulepunkter som oppsummerer kjernen/hovedpoengene i episoden'
    );
  if (generateBlogPost)
    wanted.push(
      '- "blogPost": et fullstendig blogginnlegg (minst 400 ord, markdown med overskrifter og avsnitt)'
    );
  if (generateSocialPosts)
    wanted.push(
      '- "socialPosts": { "linkedin" (200-300 ord, profesjonell, 3-5 emneknagger), "instagram" (100-150 ord, engasjerende, 5-8 emneknagger), "twitter" (maks 280 tegn) }'
    );
  if (generateChapters)
    wanted.push(
      '- "chapters": liste med { "timestamp" (f.eks. "05:30"), "title" }'
    );
  if (generateClipPlan)
    wanted.push(
      '- "clipPlan": liste med de mest delbare øyeblikkene, hver med { "timestamp", "title", "hook" (ferdig caption/hook til klippet), "reason" (1 setning om hvorfor akkurat dette øyeblikket er verdt å klippe) }'
    );
  if (generateCarousels)
    wanted.push(
      '- "carousels": liste med 1-2 karuseller, hver med { "title", "slides" (4-7 korte tekster) }'
    );
  if (generateNewsletter)
    wanted.push(
      '- "newsletter": { "subject" (emnelinje), "body" (e-posttekst) }'
    );
  if (generateQuotes)
    wanted.push(
      '- "quotes": liste med 4-8 korte, slagkraftige sitater (ren tekst)'
    );

  if (wanted.length === 0) {
    return {
      success: false,
      error: "Velg minst én type innhold å generere.",
    };
  }

  const system = await resolveSystemPrompt("podcast-to-content-system");

  const prompt = `Podkast-transkripsjon:
"""
${transcript}
"""

Generer NØYAKTIG disse innholdstypene og sett ALLE andre felt til null:
${wanted.join("\n")}`;

  try {
    const result = streamText({
      model: utilityModel,
      system,
      prompt,
      output: Output.object({ schema: podcastContentSchema }),
    });

    const content = await result.output;

    // Modellen returnerer null for seksjonar som ikkje er bedt om; mapp til
    // undefined så response-typen blir rein for klienten.
    return {
      success: true,
      keyPoints: content.keyPoints ?? undefined,
      blogPost: content.blogPost ?? undefined,
      socialPosts: content.socialPosts ?? undefined,
      chapters: content.chapters ?? undefined,
      clipPlan: content.clipPlan ?? undefined,
      carousels: content.carousels ?? undefined,
      newsletter: content.newsletter ?? undefined,
      quotes: content.quotes ?? undefined,
    };
  } catch (error) {
    console.error("Podcast content generation failed:", error);
    return {
      success: false,
      error: "Kunne ikke generere innhold. Prøv igjen.",
    };
  }
}
