import {
  type YearlyPlanStream,
  type YearlyPlannerRequest,
  audienceLabels,
  contentToneLabels,
  frequencyLabels,
  publishChannelLabels,
  yearlyPlanStreamSchema,
} from "@poynt/planner-validators";
import { type DeepPartial, Output, streamText } from "ai";
import { flagshipModel } from "./models";
import { getWorkspaceProfileBlock } from "./profile-context";
import { resolveSystemPrompt } from "./prompt-template";

/**
 * Streamer et årshjul via det stabile `streamText` + `Output.object`-API-et.
 * Returnerer `partialOutputStream` (progressive delobjekter) og `output` (det
 * ferdige, validerte objektet). Server-actionen pakker dette i en streamable
 * value til klienten.
 *
 * «Felles hjerne»: beriker prompten med bedriftsprofilen i tillegg til
 * skjema-svarene.
 */
export async function streamYearlyPlan({
  userId,
  input,
}: {
  userId: string;
  input: YearlyPlannerRequest;
}): Promise<{
  partialOutputStream: AsyncIterable<DeepPartial<YearlyPlanStream>>;
  output: PromiseLike<YearlyPlanStream>;
}> {
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

  const system = await resolveSystemPrompt("yearly-planner-system", {
    currentYear,
  });

  const channelsText = channels.map((c) => publishChannelLabels[c]).join(", ");

  const profileBlock = await getWorkspaceProfileBlock(userId);

  const prompt = `
Lag en komplett årsplan for innholdspublisering for ${currentYear}:

Bransje: ${industry}
Kanaler: ${channelsText}
Publiseringsfrekvens: ${frequencyLabels[frequency]}
Målgruppe: ${audienceLabels[audience]}
${tone ? `Tone of voice: ${contentToneLabels[tone]}` : ""}
${importantDates ? `Viktige datoer for bedriften: ${importantDates}` : ""}
${focusTopics ? `Fokusområder/temaer: ${focusTopics}` : ""}
${profileBlock}
Lag en praktisk årsplan med konkrete innholdsideer for alle 12 måneder, tilpasset bransjen og norske sesonger. Sett "year" til ${currentYear}.`;

  const result = streamText({
    model: flagshipModel,
    system,
    prompt,
    output: Output.object({ schema: yearlyPlanStreamSchema }),
  });

  return {
    partialOutputStream: result.partialOutputStream,
    output: result.output,
  };
}
