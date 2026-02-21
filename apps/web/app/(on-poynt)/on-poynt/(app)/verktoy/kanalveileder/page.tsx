import { TierGate } from "@/components/planner/tier-gate";
import { createServerCaller } from "@/lib/planner/trpc-server";
import type { ChannelRecommendation, SavedResult } from "@/lib/types";
import { ChannelGuideClient } from "./channel-guide-client";

export default async function ChannelGuidePage() {
  const trpc = await createServerCaller();
  const [savedResults, industries, workspaceProfile] = await Promise.all([
    trpc.toolResult.list({ toolId: "channel-guide", limit: 1 }).catch(() => []),
    trpc.industry.list().catch(() => []),
    trpc.workspaceProfile.get().catch(() => null),
  ]);

  let initialSavedResult: SavedResult | null = null;
  const firstResult = savedResults[0];
  if (firstResult?.result) {
    const result = firstResult.result as {
      channels?: ChannelRecommendation[];
      reasoning?: string;
    };
    if (result.channels) {
      initialSavedResult = {
        id: firstResult.id,
        channels: result.channels,
        reasoning: result.reasoning,
        createdAt: new Date(firstResult.createdAt),
      };
    }
  }

  const activeIndustries = industries.filter((i) => i.isActive);
  const initialIndustryId = workspaceProfile?.industryId ?? null;
  const initialTargetAudience = workspaceProfile?.audienceType ?? null;

  return (
    <TierGate>
      <ChannelGuideClient
        initialSavedResult={initialSavedResult}
        industries={activeIndustries}
        initialIndustryId={initialIndustryId}
        initialTargetAudience={initialTargetAudience}
      />
    </TierGate>
  );
}
