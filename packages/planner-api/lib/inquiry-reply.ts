import {
  type InquiryReplyRequest,
  type InquiryReplyStream,
  inquiryGoalLabels,
  inquiryReplyStreamSchema,
  inquirySourceLabels,
  replySentimentLabels,
} from "@poynt/planner-validators";
import {
  type DeepPartial,
  type LanguageModel,
  type LanguageModelUsage,
  Output,
  streamText,
} from "ai";
import { flagshipModel } from "./models";
import { getWorkspaceProfileBlock } from "./profile-context";
import { resolveSystemPrompt } from "./prompt-template";

/**
 * Streamer 2-3 svarvarianter på en kundehenvendelse / anmeldelse i bedriftens
 * stemme. Samme stabile `streamText` + `Output.object`-mønster som de andre
 * verktøyene, og samme «felles hjerne»-berikelse — særlig viktig her, siden
 * svaret skal høres ut som NETTOPP denne bedriften (merkevarebriefen).
 */
export async function streamInquiryReply({
  userId,
  input,
  model = flagshipModel,
  systemPromptOverride,
  includeProfile = true,
}: {
  userId: string;
  input: InquiryReplyRequest;
  /** Overstyr modellen (brukes av Modell-laben). Default = flaggskip-modellen. */
  model?: LanguageModel;
  /** Overstyr system-prompten (brukes av Modell-laben). Default = DB/fallback. */
  systemPromptOverride?: string;
  /** «Felles hjerne»-berikelse på/av. */
  includeProfile?: boolean;
}): Promise<{
  partialOutputStream: AsyncIterable<DeepPartial<InquiryReplyStream>>;
  output: PromiseLike<InquiryReplyStream>;
  usage: PromiseLike<LanguageModelUsage>;
}> {
  const { incomingMessage, source, sentiment, goal, extraContext } = input;

  const profileBlock = includeProfile
    ? await getWorkspaceProfileBlock(userId)
    : "";

  const system =
    systemPromptOverride ?? (await resolveSystemPrompt("inquiry-reply-system"));

  const prompt = `
Meldingen som skal besvares (kom inn via ${inquirySourceLabels[source]}):
"""
${incomingMessage}
"""
${sentiment ? `Avsenders tone (brukerens vurdering): ${replySentimentLabels[sentiment]}` : ""}
${goal ? `Ønsket mål med svaret: ${inquiryGoalLabels[goal]}` : ""}
${extraContext ? `Ekstra kontekst: ${extraContext}` : ""}
${profileBlock}
Vurder tonen i meldingen (detectedSentiment), gi en kort oppsummering av hva avsender egentlig vil (summary), og lag 2-3 svarvarianter (variants) som er klare til å sendes — tilpasset kanalen «${inquirySourceLabels[source]}». Avslutt med 1-3 korte, konkrete tips.`;

  const result = streamText({
    model,
    system,
    prompt,
    output: Output.object({ schema: inquiryReplyStreamSchema }),
  });

  return {
    partialOutputStream: result.partialOutputStream,
    output: result.output,
    usage: result.usage,
  };
}
