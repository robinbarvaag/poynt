"use client";

import { PlannerForm } from "@/components/yearly-planner/planner-form";
import { PlannerResult } from "@/components/yearly-planner/planner-result";
import { yearlyPlannerStreamAction } from "@/lib/planner/actions/yearly-planner";
import { useToolStream } from "@/lib/planner/use-tool-stream";
import type {
  YearlyPlan,
  YearlyPlanStream,
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

type ViewState = "intro" | "form" | "result";

type AudienceType = "b2b" | "b2c" | "both";

interface Industry {
  id: string;
  name: string;
  icon: string | null;
  isActive: boolean;
}

interface CalendarFeed {
  feedUrl: string;
  webcalUrl: string;
}

interface BusinessIdentity {
  name: string;
  logoUrl: string | null;
}

interface YearlyPlannerClientProps {
  initialSavedPlan: SavedPlan | null;
  industries: Industry[];
  initialIndustry: string | null;
  initialAudience: AudienceType | null;
  calendarFeed: CalendarFeed | null;
  business: BusinessIdentity;
}

export function YearlyPlannerClient({
  initialSavedPlan,
  industries,
  initialIndustry,
  initialAudience,
  calendarFeed,
  business,
}: YearlyPlannerClientProps) {
  // Har brukeren et lagret årshjul lander vi rett på det (kalenderen) — ingen
  // mellomside. Førstegangsbrukere får intro-en.
  const [view, setView] = useState<ViewState>(
    initialSavedPlan ? "result" : "intro"
  );
  // Det lagrede årshjulet vises direkte (ikke streaming-resultatet).
  // null = vis det som streames akkurat nå.
  const [shownSavedPlan, setShownSavedPlan] = useState<YearlyPlan | null>(
    initialSavedPlan?.plan ?? null
  );

  // Streaming-generering via server action + RSC streamable value.
  const { generate, result, isPending } = useToolStream<
    YearlyPlannerRequest,
    YearlyPlanStream
  >({
    action: yearlyPlannerStreamAction,
    toolId: "yearly-planner",
    title: "Årshjul",
    buildResult: (data) => ({ plan: data }),
    onError: () => {
      toast.error("Kunne ikke generere årshjul. Prøv igjen.");
      setView("intro");
    },
  });

  async function handleSubmit(data: YearlyPlannerRequest) {
    setShownSavedPlan(null);
    setView("result");
    await generate(data);
  }

  function handleReset() {
    setShownSavedPlan(null);
    setView("form");
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
              <Icon name="calendar-days" className="size-4" />
              Lag mitt årshjul
            </Button>

            <p className="text-sm text-muted-foreground mt-6">
              Ca. 3 minutter • 12 måneder med innhold
            </p>
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
              isLoading={isPending}
              industries={industries}
              initialIndustry={initialIndustry}
              initialAudience={initialAudience}
            />
          </motion.div>
        )}

        {view === "result" && (
          <motion.div
            key="result"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <PlannerResult
              plan={shownSavedPlan ?? result ?? undefined}
              onReset={handleReset}
              isStreaming={!shownSavedPlan && isPending}
              calendarFeed={calendarFeed}
              business={business}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
