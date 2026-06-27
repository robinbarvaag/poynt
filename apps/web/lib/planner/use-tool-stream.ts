"use client";

import { trpc } from "@/lib/planner/trpc";
import { type StreamableValue, readStreamableValue } from "@ai-sdk/rsc";
import type { DeepPartial } from "ai";
import { useState } from "react";

interface UseToolStreamOptions<TRequest, TResult> {
  /** Server action som returnerer en streamable value med delobjekter. */
  action: (input: TRequest) => Promise<StreamableValue<DeepPartial<TResult>>>;
  /** toolId for lagring i plannerToolResult. */
  toolId: string;
  /** Tittel på det lagrede resultatet. */
  title: string;
  /** Plukker ut hva som skal lagres fra det ferdige svaret. */
  buildResult: (data: DeepPartial<TResult>) => Record<string, unknown>;
  /** Kalles ved feil. */
  onError?: () => void;
}

/**
 * Gjenbrukbar STREAMING-generering via server action + RSC streamable value.
 * `result` fylles inn bit for bit mens svaret genereres (stabil streamText +
 * Output.object i bunn — ingen deprecated API). Lagrer til historikk når
 * streamen er ferdig (fra det viste objektet, så lagret == vist).
 *
 * Brukes av kanalveileder; markedsplan/årshjul arver samme mønster.
 */
export interface SavedToolResult {
  id: string;
  createdAt: Date;
}

export function useToolStream<TRequest, TResult>({
  action,
  toolId,
  title,
  buildResult,
  onError,
}: UseToolStreamOptions<TRequest, TResult>) {
  const [result, setResult] = useState<DeepPartial<TResult> | null>(null);
  const [isPending, setIsPending] = useState(false);
  // Settes når streamen er ferdig og resultatet er lagret. Lar verktøy som har
  // fremdrifts-/avhukingstilstand (f.eks. markedsplan) skru på lagring straks
  // den genererte planen finnes i databasen.
  const [saved, setSaved] = useState<SavedToolResult | null>(null);

  async function generate(request: TRequest) {
    setResult(null);
    setSaved(null);
    setIsPending(true);
    try {
      const stream = await action(request);
      let last: DeepPartial<TResult> | undefined;
      for await (const partial of readStreamableValue(stream)) {
        if (partial != null) {
          last = partial;
          setResult(partial);
        }
      }

      // Lagre det ferdige objektet (best effort — lagrings-feil feller ikke svaret).
      if (last) {
        try {
          const row = await trpc.toolResult.save.mutate({
            toolId,
            title,
            inputs: request as Record<string, unknown>,
            result: buildResult(last),
          });
          if (row) {
            setSaved({ id: row.id, createdAt: new Date(row.createdAt) });
          }
        } catch (saveError) {
          console.error("Could not save result:", saveError);
        }
      }
    } catch (error) {
      console.error("Generation failed:", error);
      onError?.();
    } finally {
      setIsPending(false);
    }
  }

  return { generate, result, isPending, saved };
}
