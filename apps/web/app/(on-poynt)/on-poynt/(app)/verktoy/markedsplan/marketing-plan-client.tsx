"use client";

import { PlanForm } from "@/components/marketing-plan/plan-form";
import { PlanResult } from "@/components/marketing-plan/plan-result";
import { trpc } from "@/lib/planner/trpc";
import type {
  MarketingPlan,
  MarketingPlanRequest,
} from "@poynt/planner-validators";
import { toast } from "@poynt/ui";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
interface SavedPlan {
  id: string;
  plan: MarketingPlan;
  createdAt: Date;
}

type ViewState = "intro" | "saved" | "form" | "result";

type CompanySize = "solo" | "small" | "medium" | "large";

interface MarketingPlanClientProps {
  initialSavedPlan: SavedPlan | null;
  initialIndustry: string | null;
  initialCompanySize: CompanySize | null;
  initialTargetAudience: string | null;
  initialProgress: any[];
}

export function MarketingPlanClient({
  initialSavedPlan,
  initialIndustry,
  initialCompanySize,
  initialTargetAudience,
  initialProgress,
}: MarketingPlanClientProps) {
  const [view, setView] = useState<ViewState>(
    initialSavedPlan ? "saved" : "intro"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MarketingPlan | null>(null);
  const [savedPlan, setSavedPlan] = useState<SavedPlan | null>(
    initialSavedPlan
  );

  async function handleSubmit(data: MarketingPlanRequest) {
    setIsLoading(true);

    try {
      const response = await trpc.ai.marketingPlan.mutate(data);

      if (!response.success || response.error) {
        toast.error(response.error || "Noe gikk galt. Prøv igjen.");
      } else if (response.plan) {
        setResult(response.plan);
        setView("result");

        // Save result to database
        try {
          const saved = await trpc.toolResult.save.mutate({
            toolId: "marketing-plan",
            title: "Markedsplan",
            inputs: data as Record<string, unknown>,
            result: { plan: response.plan },
          });
          if (saved) {
            setSavedPlan({
              id: saved.id,
              plan: response.plan,
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

  function handleReset() {
    setResult(null);
    setView("intro");
  }

  function startForm() {
    setView("form");
  }

  const fadeIn = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
  };

  return (
    <div className="container py-12 md:py-16">
      <AnimatePresence mode="wait">
        {/* Intro mode - use PlanResult */}
        {view === "intro" && (
          <motion.div
            key="intro"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <PlanResult mode="intro" onStartForm={startForm} />
          </motion.div>
        )}

        {/* Saved state - show result with saved plan */}
        {view === "saved" && savedPlan && (
          <motion.div
            key="saved"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <PlanResult
              plan={savedPlan.plan}
              onReset={handleReset}
              mode="result"
              toolResultId={savedPlan.id}
              initialProgress={initialProgress}
            />
          </motion.div>
        )}

        {view === "form" && (
          <motion.div
            key="form"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="mx-auto"
          >
            <PlanForm
              onSubmit={handleSubmit}
              isLoading={isLoading}
              initialIndustry={initialIndustry}
              initialCompanySize={initialCompanySize}
              initialTargetAudience={initialTargetAudience}
            />
          </motion.div>
        )}

        {view === "result" && result && savedPlan && (
          <motion.div
            key="result"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <PlanResult
              plan={result}
              onReset={handleReset}
              toolResultId={savedPlan.id}
              initialProgress={[]}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
