import {
  type GeneratePostRequest,
  type GeneratedPostStream,
  generatedPostStreamSchema,
} from "@poynt/planner-validators";
import { type DeepPartial, Output, streamText } from "ai";
import { flagshipModel } from "./models";
import { getWorkspaceProfileBlock } from "./profile-context";
import { resolveSystemPrompt } from "./prompt-template";

/**
 * Drill-down: gjør én post-idé fra årshjulet om til ETT ferdig innlegg (caption
 * + hashtags + bilde-tips), streamet via det stabile `streamText` +
 * `Output.object`-API-et.
 *
 * Her er hele poenget med «felles hjerne 2.0»: prompten beriket med
 * merkevarebriefen gjør at captionen treffer bedriftens faktiske stemme.
 */
export async function streamPost({
  userId,
  input,
}: {
  userId: string;
  input: GeneratePostRequest;
}): Promise<{
  partialOutputStream: AsyncIterable<DeepPartial<GeneratedPostStream>>;
  output: PromiseLike<GeneratedPostStream>;
}> {
  const { channel, idea, type, monthName } = input;

  const profileBlock = await getWorkspaceProfileBlock(userId);
  const system = await resolveSystemPrompt("post-caption-system");

  const prompt = `
Lag ETT ferdig innlegg basert på denne idéen fra innholdskalenderen:

Kanal: ${channel}
${type ? `Innholdstype: ${type}` : ""}
${monthName ? `Måned: ${monthName}` : ""}
Idé: ${idea}
${profileBlock}
Skriv captionen klar til å lime rett inn, i bedriftens stemme. Inkluder hashtags og et konkret bilde-tips.`;

  const result = streamText({
    model: flagshipModel,
    system,
    prompt,
    output: Output.object({ schema: generatedPostStreamSchema }),
  });

  return {
    partialOutputStream: result.partialOutputStream,
    output: result.output,
  };
}
