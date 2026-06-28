"use client";

import { DeclineForm } from "@/components/decline-generator/decline-form";
import { DeclineResult } from "@/components/decline-generator/decline-result";
import { trpc } from "@/lib/planner/trpc";
import type { DeclineRequest } from "@poynt/planner-validators";
import { PageShell, toast } from "@poynt/ui";
import { useState } from "react";

interface SavedResult {
  id: string;
  text: string;
  title: string | null;
  createdAt: Date;
}

interface DeclineGeneratorClientProps {
  initialSavedResult: SavedResult | null;
}

export function DeclineGeneratorClient({
  initialSavedResult,
}: DeclineGeneratorClientProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(
    initialSavedResult?.text ?? null
  );
  const [savedResult, setSavedResult] = useState<SavedResult | null>(
    initialSavedResult
  );

  async function handleSubmit(data: DeclineRequest) {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await trpc.ai.decline.mutate(data);

      if (!response.success || response.error) {
        toast.error(response.error || "Noe gikk galt");
      } else if (response.result) {
        setResult(response.result);

        // Save result to database
        try {
          const saved = await trpc.toolResult.save.mutate({
            toolId: "decline-generator",
            title: `Avslag: ${data.situationType}`,
            inputs: data as Record<string, unknown>,
            result: { text: response.result },
          });
          if (saved) {
            setSavedResult({
              id: saved.id,
              text: response.result,
              title: saved.title,
              createdAt: new Date(saved.createdAt),
            });
          }
        } catch (saveError) {
          console.error("Could not save result:", saveError);
        }
      }
    } catch (error) {
      console.error("tRPC error:", error);
      toast.error("Kunne ikke koble til serveren. Prøv igjen.");
    }

    setIsLoading(false);
  }

  return (
    <PageShell>
      <header className="space-y-1">
        <h1 className="font-heading font-semibold text-2xl">Si nei med stil</h1>
        <p className="text-muted-foreground text-sm">
          Lim inn forespørselen, så får du tre høflige måter å takke nei på —
          tilpasset situasjonen og klare til å sende.
        </p>
      </header>

      <DeclineForm onSubmit={handleSubmit} isLoading={isLoading} />

      {result && (
        <DeclineResult
          mode="result"
          result={result}
          toolResultId={savedResult?.id}
        />
      )}
    </PageShell>
  );
}
