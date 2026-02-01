import { createServerCaller } from "@/lib/planner/trpc-server";
import { ChannelGuideClient } from "./channel-guide-client";

interface ChannelRecommendation {
  name: string;
  matchPercent: number;
  reason: string;
}

interface SavedResult {
  id: string;
  channels: ChannelRecommendation[];
  reasoning?: string;
  createdAt: Date;
}

export interface Industry {
  id: string;
  name: string;
  icon: string | null;
  isActive: boolean;
}

export default async function ChannelGuidePage() {
  const trpc = await createServerCaller();

  // Fetch all data in parallel server-side
  const [savedResults, industries, workspaceProfile] = await Promise.all([
    trpc.toolResult.list({ toolId: "channel-guide", limit: 1 }).catch(() => []),
    trpc.industry.list().catch(() => []),
    trpc.workspaceProfile.get().catch(() => null),
  ]);

  // Process saved result
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

  // Filter active industries
  const activeIndustries = industries.filter((i) => i.isActive);

  // Get initial industry from workspace profile
  const initialIndustryId = workspaceProfile?.industryId ?? null;

  // Get initial target audience from workspace profile
  const initialTargetAudience = workspaceProfile?.audienceType ?? null;

  return (
    <ChannelGuideClient
      initialSavedResult={initialSavedResult}
      industries={activeIndustries}
      initialIndustryId={initialIndustryId}
      initialTargetAudience={initialTargetAudience}
    />
  );
}

