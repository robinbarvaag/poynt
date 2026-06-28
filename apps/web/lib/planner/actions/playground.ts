"use server";

import { createStreamableValue } from "@ai-sdk/rsc";
import { estimatePlaygroundCost } from "@poynt/planner-api/lib/models";
import {
  getPlaygroundWorkspaceInput,
  isPlaygroundToolId,
  readPlaygroundUsage,
  startPlaygroundStream,
} from "@poynt/planner-api/lib/playground";
import { getPlaygroundSession } from "../playground-access";

/** Én bit av en strømmende lab-kjøring for én modell. */
export type PlaygroundChunk =
  | { type: "partial"; output: unknown }
  | {
      type: "done";
      output: unknown;
      usage?: {
        inputTokens?: number;
        outputTokens?: number;
        totalTokens?: number;
      };
      cost?: { usd: number; nok: number };
      ms: number;
    }
  | { type: "error"; error: string };

export type StreamPlaygroundInput = {
  toolId: string;
  systemPrompt: string;
  inputJson: string;
  modelId: string;
  includeProfile: boolean;
};

/**
 * Kjører ÉN modell strømmende, og returnerer en streamable value med
 * progressive delobjekter + et avsluttende `done` med token-bruk, kostnad og
 * latency. Klienten kaller denne én gang per valgt modell (parallelt), så raske
 * modeller dukker opp før trege. Admin-gated.
 */
export async function streamPlaygroundModelAction(args: StreamPlaygroundInput) {
  const stream = createStreamableValue<PlaygroundChunk>();

  (async () => {
    const session = await getPlaygroundSession();
    if (!session) {
      stream.update({ type: "error", error: "Ingen tilgang til laben." });
      stream.done();
      return;
    }

    const toolId = args.toolId;
    if (!isPlaygroundToolId(toolId)) {
      stream.update({ type: "error", error: `Ukjent verktøy: ${toolId}` });
      stream.done();
      return;
    }

    let input: unknown;
    try {
      input = JSON.parse(args.inputJson);
    } catch {
      stream.update({ type: "error", error: "Input er ikke gyldig JSON." });
      stream.done();
      return;
    }

    const started = await startPlaygroundStream({
      toolId,
      userId: session.userId,
      modelId: args.modelId,
      systemPrompt: args.systemPrompt,
      input,
      includeProfile: args.includeProfile,
    });
    if (!started.ok) {
      stream.update({ type: "error", error: started.error });
      stream.done();
      return;
    }

    const start = performance.now();
    try {
      for await (const partial of started.partialOutputStream) {
        stream.update({ type: "partial", output: partial });
      }
      const output = await started.output;
      const usage = readPlaygroundUsage(await started.usage);
      stream.update({
        type: "done",
        output,
        usage,
        cost: estimatePlaygroundCost(args.modelId, usage),
        ms: Math.round(performance.now() - start),
      });
      stream.done();
    } catch (error) {
      stream.update({
        type: "error",
        error: error instanceof Error ? error.message : String(error),
      });
      stream.done();
    }
  })();

  return stream.value;
}

export type LoadWorkspaceInputResponse = {
  ok: boolean;
  error?: string;
  found?: boolean;
  input?: string;
};

/**
 * Henter dummy-input fra den aktive bedriften til den innloggede admin-brukeren.
 */
export async function loadWorkspaceInputAction(
  toolId: string
): Promise<LoadWorkspaceInputResponse> {
  const session = await getPlaygroundSession();
  if (!session) return { ok: false, error: "Ingen tilgang til laben." };
  if (!isPlaygroundToolId(toolId)) {
    return { ok: false, error: `Ukjent verktøy: ${toolId}` };
  }

  const { found, input } = await getPlaygroundWorkspaceInput({
    userId: session.userId,
    toolId,
  });
  return { ok: true, found, input };
}
