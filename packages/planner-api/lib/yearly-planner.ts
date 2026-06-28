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

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12
  const monthNamesNb = [
    "januar",
    "februar",
    "mars",
    "april",
    "mai",
    "juni",
    "juli",
    "august",
    "september",
    "oktober",
    "november",
    "desember",
  ];
  const currentMonthName = monthNamesNb[now.getMonth()];
  const remainingMonths = 12 - currentMonth + 1;

  const system = await resolveSystemPrompt("yearly-planner-system", {
    currentYear,
    currentMonthName,
  });

  const channelsText = channels.map((c) => publishChannelLabels[c]).join(", ");

  const profileBlock = await getWorkspaceProfileBlock(userId);

  const prompt = `
Lag en innholdsplan for resten av ${currentYear}, fra og med ${currentMonthName}:

Bransje: ${industry}
Kanaler: ${channelsText}
Publiseringsfrekvens: ${frequencyLabels[frequency]}
Målgruppe: ${audienceLabels[audience]}
${tone ? `Tone of voice: ${contentToneLabels[tone]}` : ""}
${importantDates ? `Viktige datoer for bedriften: ${importantDates}` : ""}
${focusTopics ? `Fokusområder/temaer: ${focusTopics}` : ""}
${profileBlock}
Lag en praktisk plan med konkrete innholdsideer, tilpasset bransjen og norske sesonger. Planen skal dekke månedene fra og med ${currentMonthName} (måned ${currentMonth}) til og med desember — ${remainingMonths} måneder totalt. IKKE lag innhold for måneder som allerede er passert i år. Bruk riktig "month"-nummer (${currentMonth}–12) og norsk "monthName" for hver måned. Sett "year" til ${currentYear}.`;

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
