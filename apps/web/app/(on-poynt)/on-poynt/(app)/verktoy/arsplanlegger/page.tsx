import { TierGate } from "@/components/planner/tier-gate";
import { requireFeature } from "@/lib/features/server";
import { getCalendarFeedUrls } from "@/lib/planner/calendar-feed";
import { faviconFor } from "@/lib/planner/scheduled-posts";
import { createServerCaller } from "@/lib/planner/trpc-server";
import type { YearlyPlan } from "@poynt/planner-validators";
import { YearlyPlannerClient } from "./yearly-planner-client";

interface SavedPlan {
  id: string;
  plan: YearlyPlan;
  createdAt: Date;
}

interface Industry {
  id: string;
  name: string;
  icon: string | null;
  isActive: boolean;
}

export default async function YearlyPlannerPage() {
  await requireFeature("arshjul");
  const trpc = await createServerCaller();

  // Server-side data fetching in parallel
  const [savedResults, industries, workspaceProfile, calendarFeed, workspace] =
    await Promise.all([
      trpc.toolResult
        .list({ toolId: "yearly-planner", limit: 1 })
        .catch(() => []),
      trpc.industry.list().catch(() => []),
      trpc.workspaceProfile.get().catch(() => null),
      getCalendarFeedUrls().catch(() => null),
      trpc.workspace.getCurrentWorkspace().catch(() => null),
    ]);

  // Bedrifts-identitet til forhåndsvisningen: navn + logo (favicon fra nettsiden
  // i merkevarebriefen, hvis den finnes).
  const brandBrief = workspaceProfile?.brandBrief as
    | { sourceUrl?: string | null }
    | null
    | undefined;
  const business = {
    name: workspace?.name ?? "Din bedrift",
    logoUrl: faviconFor(brandBrief?.sourceUrl),
  };

  // Parse saved plan
  let initialSavedPlan: SavedPlan | null = null;
  const firstResult = savedResults[0];
  if (firstResult?.result) {
    const result = firstResult.result as { plan?: YearlyPlan };
    if (result.plan) {
      initialSavedPlan = {
        id: firstResult.id,
        plan: result.plan,
        createdAt: new Date(firstResult.createdAt),
      };
    }
  }

  // Get active industries
  const activeIndustries = industries.filter((i: Industry) => i.isActive);

  // Find initial industry name from profile
  const initialIndustry = workspaceProfile?.industryId
    ? (activeIndustries.find(
        (i: Industry) => i.id === workspaceProfile.industryId
      )?.name ?? null)
    : null;

  // Get initial audience type from profile
  const initialAudience = workspaceProfile?.audienceType ?? null;

  return (
    <TierGate>
      <YearlyPlannerClient
        initialSavedPlan={initialSavedPlan}
        industries={activeIndustries}
        initialIndustry={initialIndustry}
        initialAudience={initialAudience}
        calendarFeed={calendarFeed}
        business={business}
      />
    </TierGate>
  );
}
