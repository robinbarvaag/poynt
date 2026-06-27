import {
  type AdaptPostRequest,
  type AdaptedPostsStream,
  adaptedPostsStreamSchema,
} from "@poynt/planner-validators";
import { type DeepPartial, Output, streamText } from "ai";
import { flagshipModel } from "./models";
import { getWorkspaceProfileBlock } from "./profile-context";
import { resolveSystemPrompt } from "./prompt-template";

/**
 * Multi-kanal: tar ETT ferdig innlegg og streamer én tilpasset variant per
 * ønsket kanal (LinkedIn ≠ Instagram ≠ TikTok …), i bedriftens stemme via
 * merkevarebriefen. Stabil `streamText` + `Output.object`.
 */
export async function streamAdaptedPosts({
  userId,
  input,
}: {
  userId: string;
  input: AdaptPostRequest;
}): Promise<{
  partialOutputStream: AsyncIterable<DeepPartial<AdaptedPostsStream>>;
  output: PromiseLike<AdaptedPostsStream>;
}> {
  const { caption, sourceChannel, targetChannels, idea } = input;

  const profileBlock = await getWorkspaceProfileBlock(userId);
  const system = await resolveSystemPrompt("post-adapt-system");

  const prompt = `
Her er et ferdig innlegg skrevet for ${sourceChannel}:

"""
${caption}
"""
${idea ? `\nOpprinnelig idé: ${idea}` : ""}

Lag én tilpasset variant for hver av disse kanalene, i denne rekkefølgen: ${targetChannels.join(", ")}.
Behold budskapet og stemmen, men skriv om så hver variant føles hjemme på sin kanal.
${profileBlock}`;

  const result = streamText({
    model: flagshipModel,
    system,
    prompt,
    output: Output.object({ schema: adaptedPostsStreamSchema }),
  });

  return {
    partialOutputStream: result.partialOutputStream,
    output: result.output,
  };
}
