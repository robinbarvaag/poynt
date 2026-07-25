import { TierGate } from "@/components/planner/tier-gate";
import { requireFeature } from "@/lib/features/server";
import { createServerCaller } from "@/lib/planner/trpc-server";
import type {
  ChannelGuideProfile,
  ChannelRecommendation,
  SavedResult,
} from "@/lib/types";
import { ChannelGuideClient } from "./channel-guide-client";

export default async function ChannelGuidePage() {
  await requireFeature("kanalveileder");
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
      nextSteps?: string[];
    };
    if (result.channels) {
      initialSavedResult = {
        id: firstResult.id,
        channels: result.channels,
        reasoning: result.reasoning,
        nextSteps: result.nextSteps,
        createdAt: new Date(firstResult.createdAt),
      };
    }
  }

  const activeIndustries = industries.filter((i) => i.isActive);
  const industryId = workspaceProfile?.industryId ?? null;

  const profile: ChannelGuideProfile = {
    industryId,
    industryName:
      activeIndustries.find((i) => i.id === industryId)?.name ?? null,
    audienceType:
      (workspaceProfile?.audienceType as ChannelGuideProfile["audienceType"]) ??
      null,
    mainGoal:
      (workspaceProfile?.mainGoal as ChannelGuideProfile["mainGoal"]) ?? null,
    weeklyTime:
      (workspaceProfile?.weeklyTime as ChannelGuideProfile["weeklyTime"]) ??
      null,
    strengths:
      (workspaceProfile?.strengths as ChannelGuideProfile["strengths"]) ?? null,
  };

  return (
    <TierGate>
      <ChannelGuideClient
        initialSavedResult={initialSavedResult}
        industries={activeIndustries}
        profile={profile}
      />
    </TierGate>
  );
}
