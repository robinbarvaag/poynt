import { openai } from "@ai-sdk/openai";
import { db } from "@poynt/planner-db";
import { plannerIndustry } from "@poynt/planner-db/schema";
import {
  type ChannelGuideResponse,
  type DeclineResponse,
  type MarketingPlanResponse,
  type PodcastToContentResponse,
  type YearlyPlannerResponse,
  audienceLabels,
  budgetLabels,
  channelGuideRequestSchema,
  companySizeLabels,
  contentToneLabels,
  declineRequestSchema,
  existingActivityLabels,
  frequencyLabels,
  mainGoalLabels,
  marketingGoalLabels,
  marketingPlanRequestSchema,
  podcastToContentRequestSchema,
  previousChannelLabels,
  publishChannelLabels,
  relationshipTypeLabels,
  situationTypeLabels,
  strengthLabels,
  targetAudienceLabels,
  timeframeLabels,
  toneTypeLabels,
  weeklyTimeLabels,
  yearlyPlannerRequestSchema,
} from "@poynt/planner-validators";
import { generateText } from "ai";
import { eq } from "drizzle-orm";
import { resolveSystemPrompt } from "../lib/prompt-template";
import { aiProtectedProcedure, router } from "../trpc";

export const aiRouter = router({
  decline: aiProtectedProcedure
    .input(declineRequestSchema)
    .mutation(async ({ input }): Promise<DeclineResponse> => {
      const {
        situationType,
        relationship,
        tone,
        keepDoorOpen,
        additionalContext,
        originalMessage,
      } = input;

      // Bygg prompt basert på om vi har originalMessage og/eller situationType
      let prompt: string;
      let promptId: string;

      if (originalMessage && !situationType) {
        // La AI analysere situasjonen selv basert på meldingen
        promptId = "decline-generator-analysis";
        prompt = `
Opprinnelig melding å svare på:
"""
${originalMessage}
"""

Relasjon til personen: ${relationshipTypeLabels[relationship]}
Ønsket tone: ${toneTypeLabels[tone]}
Holde døren åpen for fremtiden: ${keepDoorOpen ? "Ja" : "Nei"}
${additionalContext ? `Ekstra kontekst: ${additionalContext}` : ""}

Analyser meldingen og forstå hva personen ber om. Skriv deretter 3 varianter av et avslag:

## Variant 1: Kort og direkte
[2-3 setninger, rett på sak]

## Variant 2: Varm og forklarende
[3-4 setninger med litt mer begrunnelse]

## Variant 3: Profesjonell med alternativ
[Avslag + forslag til annen løsning eller tidspunkt]
`;
      } else if (originalMessage && situationType) {
        // Vi har både melding og situasjonstype
        promptId = "decline-generator-system";
        prompt = `
Opprinnelig melding å svare på:
"""
${originalMessage}
"""

Situasjon: ${situationTypeLabels[situationType]}
Relasjon til personen: ${relationshipTypeLabels[relationship]}
Ønsket tone: ${toneTypeLabels[tone]}
Holde døren åpen for fremtiden: ${keepDoorOpen ? "Ja" : "Nei"}
${additionalContext ? `Ekstra kontekst: ${additionalContext}` : ""}

Skriv 3 varianter av et avslag som svar på meldingen ovenfor:

## Variant 1: Kort og direkte
[2-3 setninger, rett på sak]

## Variant 2: Varm og forklarende
[3-4 setninger med litt mer begrunnelse]

## Variant 3: Profesjonell med alternativ
[Avslag + forslag til annen løsning eller tidspunkt]
`;
      } else if (situationType) {
        // Bare situasjonstype, ingen melding (original oppførsel)
        promptId = "decline-generator-system";
        prompt = `
Situasjon: ${situationTypeLabels[situationType]}
Relasjon til personen: ${relationshipTypeLabels[relationship]}
Ønsket tone: ${toneTypeLabels[tone]}
Holde døren åpen for fremtiden: ${keepDoorOpen ? "Ja" : "Nei"}
${additionalContext ? `Ekstra kontekst: ${additionalContext}` : ""}

Skriv 3 varianter av et avslag:

## Variant 1: Kort og direkte
[2-3 setninger, rett på sak]

## Variant 2: Varm og forklarende
[3-4 setninger med litt mer begrunnelse]

## Variant 3: Profesjonell med alternativ
[Avslag + forslag til annen løsning eller tidspunkt]
`;
      } else {
        // Verken melding eller situasjonstype - feil
        return {
          success: false,
          error:
            "Du må enten velge en situasjonstype eller lime inn en melding.",
        };
      }

      try {
        const systemToUse = await resolveSystemPrompt(promptId);
        const { text } = await generateText({
          model: openai("gpt-4o-mini"),
          system: systemToUse,
          prompt,
        });

        return { success: true, result: text };
      } catch (error) {
        console.error("AI generation failed:", error);
        return {
          success: false,
          error:
            "Kunne ikke generere tekst. Sjekk at API-nøkkelen er satt opp.",
        };
      }
    }),

  channelGuide: aiProtectedProcedure
    .input(channelGuideRequestSchema)
    .mutation(async ({ input }): Promise<ChannelGuideResponse> => {
      const {
        industryId,
        targetAudience,
        mainGoal,
        weeklyTime,
        strengths,
        previousChannels,
        previousExperience,
      } = input;

      // Look up industry name from database
      let industryName = industryId;
      try {
        const ind = await db.query.plannerIndustry.findFirst({
          where: eq(plannerIndustry.id, industryId),
        });
        if (ind) {
          industryName = ind.name;
        }
      } catch (error) {
        console.error("Could not look up industry:", error);
        // Continue with industryId as fallback
      }

      const channelGuideSystemPrompt = await resolveSystemPrompt(
        "channel-guide-system"
      );

      const previousChannelsText =
        previousChannels && previousChannels.length > 0
          ? previousChannels.map((c) => previousChannelLabels[c]).join(", ")
          : "Ingen";

      const prompt = `
Bransje: ${industryName}
Målgruppe: ${targetAudienceLabels[targetAudience]}
Hovedmål: ${mainGoalLabels[mainGoal]}
Tid tilgjengelig per uke: ${weeklyTimeLabels[weeklyTime]}
Styrker: ${strengthLabels[strengths]}
Tidligere brukte kanaler: ${previousChannelsText}
${previousExperience ? `Tidligere erfaring: ${previousExperience}` : ""}

Anbefal de 3 beste markedskanalene for denne brukeren.`;

      try {
        const { text } = await generateText({
          model: openai("gpt-4o-mini"),
          system: channelGuideSystemPrompt,
          prompt,
        });

        // Parse JSON-responsen
        const parsed = JSON.parse(text);

        if (!parsed.channels || !Array.isArray(parsed.channels)) {
          return {
            success: false,
            error: "Uventet format fra AI. Prøv igjen.",
          };
        }

        return {
          success: true,
          reasoning: parsed.reasoning,
          channels: parsed.channels,
        };
      } catch (error) {
        console.error("AI generation failed:", error);

        if (error instanceof SyntaxError) {
          return {
            success: false,
            error: "Kunne ikke tolke AI-respons. Prøv igjen.",
          };
        }

        return {
          success: false,
          error:
            "Kunne ikke generere anbefalinger. Sjekk at API-nøkkelen er satt opp.",
        };
      }
    }),

  marketingPlan: aiProtectedProcedure
    .input(marketingPlanRequestSchema)
    .mutation(async ({ input }): Promise<MarketingPlanResponse> => {
      const {
        industry,
        companySize,
        mainGoal,
        timeframe,
        budget,
        existingActivities,
        targetAudienceDescription,
        competitors,
      } = input;

      const monthCount = timeframe === "3m" ? 3 : timeframe === "6m" ? 6 : 12;

      const marketingPlanSystemPrompt = await resolveSystemPrompt(
        "marketing-plan-system",
        {
          channelCount:
            monthCount <= 3 ? "1-2" : monthCount <= 6 ? "2-3" : "3-4",
        }
      );

      const existingActivitiesText =
        existingActivities && existingActivities.length > 0
          ? existingActivities.map((a) => existingActivityLabels[a]).join(", ")
          : "Ingen fast aktivitet";

      const prompt = `
Lag en ${monthCount}-måneders markedsplan for denne bedriften:

Bransje: ${industry}
Bedriftsstørrelse: ${companySizeLabels[companySize]}
Hovedmål: ${marketingGoalLabels[mainGoal]}
Tidsramme: ${timeframeLabels[timeframe]}
Budsjett: ${budget ? budgetLabels[budget] : "Ikke oppgitt"}
Eksisterende aktiviteter: ${existingActivitiesText}
${targetAudienceDescription ? `Målgruppe: ${targetAudienceDescription}` : ""}
${competitors ? `Konkurrenter: ${competitors}` : ""}

Lag en praktisk og gjennomførbar plan med fokus på ${marketingGoalLabels[mainGoal].toLowerCase()}.`;

      try {
        const { text } = await generateText({
          model: openai("gpt-4o-mini"),
          system: marketingPlanSystemPrompt,
          prompt,
        });

        // Parse JSON-responsen
        const parsed = JSON.parse(text);

        if (!parsed.summary || !parsed.channels || !parsed.timeline) {
          return {
            success: false,
            error: "Uventet format fra AI. Prøv igjen.",
          };
        }

        return {
          success: true,
          plan: parsed,
        };
      } catch (error) {
        console.error("AI generation failed:", error);

        if (error instanceof SyntaxError) {
          return {
            success: false,
            error: "Kunne ikke tolke AI-respons. Prøv igjen.",
          };
        }

        return {
          success: false,
          error:
            "Kunne ikke generere markedsplan. Sjekk at API-nøkkelen er satt opp.",
        };
      }
    }),

  yearlyPlanner: aiProtectedProcedure
    .input(yearlyPlannerRequestSchema)
    .mutation(async ({ input }): Promise<YearlyPlannerResponse> => {
      const {
        industry,
        channels,
        frequency,
        audience,
        tone,
        importantDates,
        focusTopics,
      } = input;

      const currentYear = new Date().getFullYear();

      const yearlyPlannerSystemPrompt = await resolveSystemPrompt(
        "yearly-planner-system",
        { currentYear }
      );

      const channelsText = channels
        .map((c) => publishChannelLabels[c])
        .join(", ");

      const prompt = `
Lag en komplett årsplan for innholdspublisering:

Bransje: ${industry}
Kanaler: ${channelsText}
Publiseringsfrekvens: ${frequencyLabels[frequency]}
Målgruppe: ${audienceLabels[audience]}
${tone ? `Tone of voice: ${contentToneLabels[tone]}` : ""}
${importantDates ? `Viktige datoer for bedriften: ${importantDates}` : ""}
${focusTopics ? `Fokusområder/temaer: ${focusTopics}` : ""}

Lag en praktisk årsplan med konkrete innholdsideer for hver måned, tilpasset bransjen og norske sesonger.`;

      try {
        const { text } = await generateText({
          model: openai("gpt-4o-mini"),
          system: yearlyPlannerSystemPrompt,
          prompt,
        });

        // Parse JSON-responsen
        const parsed = JSON.parse(text);

        if (
          !parsed.summary ||
          !parsed.months ||
          !Array.isArray(parsed.months)
        ) {
          return {
            success: false,
            error: "Uventet format fra AI. Prøv igjen.",
          };
        }

        return {
          success: true,
          plan: parsed,
        };
      } catch (error) {
        console.error("AI generation failed:", error);

        if (error instanceof SyntaxError) {
          return {
            success: false,
            error: "Kunne ikke tolke AI-respons. Prøv igjen.",
          };
        }

        return {
          success: false,
          error:
            "Kunne ikke generere årsplan. Sjekk at API-nøkkelen er satt opp.",
        };
      }
    }),

  podcastToContent: aiProtectedProcedure
    .input(podcastToContentRequestSchema)
    .mutation(async ({ input }): Promise<PodcastToContentResponse> => {
      const {
        transcript,
        generateBlogPost,
        generateSocialPosts,
        generateChapters,
      } = input;

      const sections: string[] = [];
      if (generateBlogPost) sections.push("blogPost");
      if (generateSocialPosts) sections.push("socialPosts");
      if (generateChapters) sections.push("chapters");

      if (sections.length === 0) {
        return {
          success: false,
          error: "Vel minst ein type innhald å generera.",
        };
      }

      // Selve JSON-formatet er dynamisk (avhenger av hvilke innholdstyper som
      // er valgt), så det bygges i kode. Persona/regler ligger i prompt-malen.
      const formatBlock = `Format:
{
  ${
    generateBlogPost
      ? `"blogPost": {
    "title": "Tittel på blogginnlegget",
    "content": "Fullstendig blogginnlegg i markdown-format (med overskrifter, avsnitt, ev. punktlister). Minst 400 ord."
  },`
      : ""
  }
  ${
    generateSocialPosts
      ? `"socialPosts": {
    "linkedin": "LinkedIn-post (200-300 ord, profesjonell tone, med 3-5 relevante emneknaggar)",
    "instagram": "Instagram-tekst (100-150 ord, engasjerande, med 5-8 emneknaggar)",
    "twitter": "X/Twitter-post (maks 280 teikn, konsis og fengjande)"
  },`
      : ""
  }
  ${
    generateChapters
      ? `"chapters": [
    {"timestamp": "00:00", "title": "Innleiing"},
    {"timestamp": "05:30", "title": "Hovudpoeng 1"}
  ]`
      : ""
  }
}`;

      const podcastSystemBase = await resolveSystemPrompt(
        "podcast-to-content-system"
      );
      const podcastSystemPrompt = `${podcastSystemBase}

${formatBlock}`;

      const prompt = `Podkast-transkripsjon:
"""
${transcript}
"""

Generer${generateBlogPost ? " eit blogginnlegg" : ""}${generateSocialPosts ? " sosiale medier-postar" : ""}${generateChapters ? " og kapittelmerke" : ""} basert på denne transkripsjonens.`;

      try {
        const { text } = await generateText({
          model: openai("gpt-4o-mini"),
          system: podcastSystemPrompt,
          prompt,
        });

        const parsed = JSON.parse(text);

        return {
          success: true,
          blogPost: parsed.blogPost,
          socialPosts: parsed.socialPosts,
          chapters: parsed.chapters,
        };
      } catch (error) {
        console.error("Podcast content generation failed:", error);

        if (error instanceof SyntaxError) {
          return {
            success: false,
            error: "Kunne ikkje tolka AI-respons. Prøv igjen.",
          };
        }

        return {
          success: false,
          error:
            "Kunne ikkje generera innhald. Sjekk at API-nøkkelen er satt opp.",
        };
      }
    }),
});
