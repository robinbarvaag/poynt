import { TierGate } from "@/components/planner/tier-gate";
import { createServerCaller } from "@/lib/planner/trpc-server";
import type { MarketingPlan } from "@poynt/planner-validators";
import { MarketingPlanClient } from "./marketing-plan-client";

interface SavedPlan {
  id: string;
  plan: MarketingPlan;
  createdAt: Date;
}

interface Industry {
  id: string;
  name: string;
  icon: string | null;
  isActive: boolean;
}

// Company size type (same as profile)
type CompanySize = "solo" | "small" | "medium" | "large";

export default async function MarketingPlanPage() {
  const trpc = await createServerCaller();

  // Server-side data fetching in parallel
  const [savedResults, industries, workspaceProfile] = await Promise.all([
    trpc.toolResult
      .list({ toolId: "marketing-plan", limit: 1 })
      .catch(() => []),
    trpc.industry.list().catch(() => []),
    trpc.workspaceProfile.get().catch(() => null),
  ]);

  // Parse saved plan
  let initialSavedPlan: SavedPlan | null = null;
  const firstResult = savedResults[0];
  if (firstResult?.result) {
    const result = firstResult.result as { plan?: MarketingPlan };
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

  // Get company size directly from profile (same values)
  const initialCompanySize =
    (workspaceProfile?.companySize as CompanySize) ?? null;

  // Get target audience description from profile
  const initialTargetAudience = workspaceProfile?.targetAudience ?? null;

  return (
    <TierGate>
      <MarketingPlanClient
        initialSavedPlan={initialSavedPlan}
        initialIndustry={initialIndustry}
        initialCompanySize={initialCompanySize}
        initialTargetAudience={initialTargetAudience}
      />
    </TierGate>
  );
}
