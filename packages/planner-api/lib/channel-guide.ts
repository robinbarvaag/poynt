import { db } from "@poynt/planner-db";
import { plannerIndustry } from "@poynt/planner-db/schema";
import {
  type ChannelGuideRequest,
  type ChannelGuideStream,
  channelGuideStreamSchema,
  mainGoalLabels,
  previousChannelLabels,
  strengthLabels,
  targetAudienceLabels,
  weeklyTimeLabels,
} from "@poynt/planner-validators";
import {
  type DeepPartial,
  type LanguageModel,
  type LanguageModelUsage,
  Output,
  streamText,
} from "ai";
import { eq } from "drizzle-orm";
import { flagshipModel } from "./models";
import { getWorkspaceProfileBlock } from "./profile-context";
import { resolveSystemPrompt } from "./prompt-template";

/**
 * Streamer en kanalanbefaling via det stabile `streamText` + `Output.object`-
 * API-et. Returnerer streamText-resultatet, som har `partialOutputStream`
 * (progressive delobjekter) og `output` (det ferdige, validerte objektet).
 * Server-actionen pakker dette i en streamable value til klienten.
 *
 * «Felles hjerne»: i tillegg til quiz-svarene beriker vi prompten med
 * bedriftsprofilen (størrelse, målgruppe, mål, kontekst), så kanalveilederen
 * deler samme forståelse av bedriften som de andre verktøyene.
 */
export async function streamChannelGuide({
  userId,
  input,
  model = flagshipModel,
  systemPromptOverride,
  includeProfile = true,
}: {
  userId: string;
  input: ChannelGuideRequest;
  /** Overstyr modellen (brukes av Modell-laben). Default = flaggskip-modellen. */
  model?: LanguageModel;
  /** Overstyr system-prompten (brukes av Modell-laben). Default = DB/fallback. */
  systemPromptOverride?: string;
  /** «Felles hjerne»-berikelse på/av (laben skrur den av for ren sammenligning). */
  includeProfile?: boolean;
}): Promise<{
  partialOutputStream: AsyncIterable<DeepPartial<ChannelGuideStream>>;
  output: PromiseLike<ChannelGuideStream>;
  usage: PromiseLike<LanguageModelUsage>;
}> {
  const {
    industryId,
    targetAudience,
    mainGoal,
    weeklyTime,
    strengths,
    previousChannels,
    previousExperience,
  } = input;

  // Quiz sender bransje-id; slå opp navnet.
  let industryName = industryId;
  try {
    const ind = await db.query.plannerIndustry.findFirst({
      where: eq(plannerIndustry.id, industryId),
    });
    if (ind) industryName = ind.name;
  } catch {
    // fall tilbake til id
  }

  // «Felles hjerne»: berik prompten med bedriftsprofilen (delt helper).
  const profileBlock = includeProfile
    ? await getWorkspaceProfileBlock(userId)
    : "";

  const previousChannelsText =
    previousChannels && previousChannels.length > 0
      ? previousChannels.map((c) => previousChannelLabels[c]).join(", ")
      : "Ingen";

  const system =
    systemPromptOverride ?? (await resolveSystemPrompt("channel-guide-system"));

  const prompt = `
Bransje: ${industryName}
Målgruppe: ${targetAudienceLabels[targetAudience]}
Hovedmål: ${mainGoalLabels[mainGoal]}
Tid tilgjengelig per uke: ${weeklyTimeLabels[weeklyTime]}
Styrker: ${strengthLabels[strengths]}
Tidligere brukte kanaler: ${previousChannelsText}
${previousExperience ? `Tidligere erfaring: ${previousExperience}` : ""}
${profileBlock}
Anbefal nøyaktig de 3 beste markedskanalene for denne brukeren (sterkeste først). Inkluder alltid en grundig samlet vurdering i feltet "reasoning".`;

  // Stabil, ikke-deprecated strukturert STREAMING i AI SDK v6:
  // streamText + `output` (Output.object). Resultatet har `partialOutputStream`
  // (progressive delobjekter) og `output` (ferdig, validert objekt).
  // (`streamObject`/`generateObject` + `experimental_*` er deprecated.)
  const result = streamText({
    model,
    system,
    prompt,
    output: Output.object({ schema: channelGuideStreamSchema }),
  });

  return {
    partialOutputStream: result.partialOutputStream,
    output: result.output,
    usage: result.usage,
  };
}
