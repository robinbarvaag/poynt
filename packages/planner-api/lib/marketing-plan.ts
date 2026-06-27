import {
  type MarketingPlanRequest,
  type MarketingPlanStream,
  budgetLabels,
  companySizeLabels,
  existingActivityLabels,
  marketingGoalLabels,
  marketingPlanStreamSchema,
  timeframeLabels,
} from "@poynt/planner-validators";
import { type DeepPartial, Output, streamText } from "ai";
import { flagshipModel } from "./models";
import { getWorkspaceProfileBlock } from "./profile-context";
import { resolveSystemPrompt } from "./prompt-template";

/**
 * Streamer en markedsplan via det stabile `streamText` + `Output.object`-API-et.
 * Returnerer `partialOutputStream` (progressive delobjekter) og `output` (det
 * ferdige, validerte objektet). Server-actionen pakker dette i en streamable
 * value til klienten.
 *
 * «Felles hjerne»: i tillegg til skjema-svarene beriker vi prompten med
 * bedriftsprofilen, så markedsplanen deler samme forståelse av bedriften som
 * de andre verktøyene.
 */
export async function streamMarketingPlan({
  userId,
  input,
}: {
  userId: string;
  input: MarketingPlanRequest;
}): Promise<{
  partialOutputStream: AsyncIterable<DeepPartial<MarketingPlanStream>>;
  output: PromiseLike<MarketingPlanStream>;
}> {
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

  const system = await resolveSystemPrompt("marketing-plan-system", {
    channelCount: monthCount <= 3 ? "1-2" : monthCount <= 6 ? "2-3" : "3-4",
  });

  const existingActivitiesText =
    existingActivities && existingActivities.length > 0
      ? existingActivities.map((a) => existingActivityLabels[a]).join(", ")
      : "Ingen fast aktivitet";

  const profileBlock = await getWorkspaceProfileBlock(userId);

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
${profileBlock}
Lag en praktisk og gjennomførbar plan med fokus på ${marketingGoalLabels[mainGoal].toLowerCase()}. Tidslinjen skal ha nøyaktig ${monthCount} måneder.`;

  const result = streamText({
    model: flagshipModel,
    system,
    prompt,
    output: Output.object({ schema: marketingPlanStreamSchema }),
  });

  return {
    partialOutputStream: result.partialOutputStream,
    output: result.output,
  };
}
