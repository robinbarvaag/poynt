import { TierGate } from "@/components/planner/tier-gate";
import { createServerCaller } from "@/lib/planner/trpc-server";
import { DeclineGeneratorClient } from "./decline-generator-client";

interface SavedResult {
  id: string;
  text: string;
  title: string | null;
  createdAt: Date;
}

export default async function DeclineGeneratorPage() {
  const trpc = await createServerCaller();

  // Server-side data fetching
  let initialSavedResult: SavedResult | null = null;

  try {
    const saved = await trpc.toolResult.list({
      toolId: "decline-generator",
      limit: 1,
    });

    const firstResult = saved[0];
    if (firstResult?.result) {
      const resultData = firstResult.result as { text?: string };
      if (resultData.text) {
        initialSavedResult = {
          id: firstResult.id,
          text: resultData.text,
          title: firstResult.title,
          createdAt: new Date(firstResult.createdAt),
        };
      }
    }
  } catch (error) {
    console.error("Could not fetch saved results:", error);
  }

  return (
    <TierGate>
      <DeclineGeneratorClient initialSavedResult={initialSavedResult} />
    </TierGate>
  );
}
