"use client";

import { PlannerForm } from "@/components/yearly-planner/planner-form";
import { PlannerResult } from "@/components/yearly-planner/planner-result";
import { trpc } from "@/lib/planner/trpc";
import type {
  YearlyPlan,
  YearlyPlannerRequest,
} from "@poynt/planner-validators";
import { toast } from "@poynt/ui";
import { Button } from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

interface SavedPlan {
  id: string;
  plan: YearlyPlan;
  createdAt: Date;
}

type ViewState = "intro" | "saved" | "form" | "result";

type AudienceType = "b2b" | "b2c" | "both";

interface Industry {
  id: string;
  name: string;
  icon: string | null;
  isActive: boolean;
}

interface YearlyPlannerClientProps {
  initialSavedPlan: SavedPlan | null;
  industries: Industry[];
  initialIndustry: string | null;
  initialAudience: AudienceType | null;
}

export function YearlyPlannerClient({
  initialSavedPlan,
  industries,
  initialIndustry,
  initialAudience,
}: YearlyPlannerClientProps) {
  const [view, setView] = useState<ViewState>(
    initialSavedPlan ? "saved" : "intro"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<YearlyPlan | null>(null);
  const [savedPlan, setSavedPlan] = useState<SavedPlan | null>(
    initialSavedPlan
  );

  async function handleSubmit(data: YearlyPlannerRequest) {
    setIsLoading(true);

    try {
      const response = await trpc.ai.yearlyPlanner.mutate(data);

      if (!response.success || response.error) {
        toast.error(response.error || "Noe gikk galt. Prøv igjen.");
      } else if (response.plan) {
        setResult(response.plan);
        setView("result");

        // Save result to database
        try {
          const saved = await trpc.toolResult.save.mutate({
            toolId: "yearly-planner",
            title: "Årshjul",
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

  function viewSavedResult() {
    if (savedPlan) {
      setResult(savedPlan.plan);
      setView("result");
    }
  }

  function formatDate(date: Date) {
    return new Intl.DateTimeFormat("nb-NO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(date));
  }

  const fadeIn = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
  };

  return (
    <div className="container py-12 md:py-16">
      <AnimatePresence mode="wait">
        {view === "intro" && (
          <motion.div
            key="intro"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-col items-center text-center"
          >
            <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
              <Icon name="calendar-days" className="size-8" />
            </div>

            <h1 className="text-3xl font-semibold tracking-tight mb-3">
              Årshjul
            </h1>

            <p className="text-lg text-muted-foreground max-w-md mb-8">
              Få en komplett innholdsplan for hele året, tilpasset din bransje
              og sesonger.
            </p>

            <Button size="lg" onClick={startForm} className="gap-2">
              <Icon name="sparkles" className="size-4" />
              Lag mitt årshjul
            </Button>

            <p className="text-sm text-muted-foreground mt-6">
              Ca. 3 minutter • 12 måneder med innhold
            </p>
          </motion.div>
        )}

        {view === "saved" && savedPlan && (
          <motion.div
            key="saved"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-col items-center text-center"
          >
            <div className="size-16 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-600 mb-6">
              <Icon name="check-circle" className="size-8" />
            </div>

            <h1 className="text-3xl font-semibold tracking-tight mb-3">
              Årshjul
            </h1>

            <p className="text-lg text-muted-foreground max-w-md mb-2">
              Du har allerede et årshjul!
            </p>

            <p className="text-sm text-muted-foreground mb-8 flex items-center gap-2">
              <Icon name="clock" className="size-4" />
              Sist oppdatert {formatDate(savedPlan.createdAt)}
            </p>

            {/* Quick preview */}
            <div className="w-full max-w-sm bg-muted/50 rounded-xl p-4 mb-8">
              <p className="text-sm text-muted-foreground mb-2">Din plan:</p>
              <p className="text-xl font-semibold">
                {savedPlan.plan.months?.length || 12} måneder planlagt
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" onClick={viewSavedResult} className="gap-2">
                <Icon name="arrow-right" className="size-4" />
                Se årshjulet
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={startForm}
                className="gap-2"
              >
                <Icon name="refresh" className="size-4" />
                Lag nytt årshjul
              </Button>
            </div>
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
            <PlannerForm
              onSubmit={handleSubmit}
              isLoading={isLoading}
              industries={industries}
              initialIndustry={initialIndustry}
              initialAudience={initialAudience}
            />
          </motion.div>
        )}

        {view === "result" && result && (
          <motion.div
            key="result"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <PlannerResult plan={result} onReset={handleReset} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
