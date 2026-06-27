"use client";

import { PlanForm } from "@/components/marketing-plan/plan-form";
import { PlanResult } from "@/components/marketing-plan/plan-result";
import { marketingPlanStreamAction } from "@/lib/planner/actions/marketing-plan";
import { trpc } from "@/lib/planner/trpc";
import { useToolStream } from "@/lib/planner/use-tool-stream";
import type {
  MarketingPlan,
  MarketingPlanRequest,
  MarketingPlanStream,
} from "@poynt/planner-validators";
import { toast } from "@poynt/ui";
import type { DeepPartial } from "ai";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

interface SavedPlan {
  id: string;
  plan: MarketingPlan;
  createdAt: Date;
}

type ViewState = "intro" | "form" | "result";

type CompanySize = "solo" | "small" | "medium" | "large";

interface MarketingPlanClientProps {
  initialSavedPlan: SavedPlan | null;
  initialIndustry: string | null;
  initialCompanySize: CompanySize | null;
  initialTargetAudience: string | null;
}

const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

/** Plan-form med feltene vi trenger for å materialisere oppgaver. */
type AnyPlan =
  | MarketingPlan
  | DeepPartial<MarketingPlanStream>
  | null
  | undefined;

export function MarketingPlanClient({
  initialSavedPlan,
  initialIndustry,
  initialCompanySize,
  initialTargetAudience,
}: MarketingPlanClientProps) {
  // Har brukeren en lagret plan lander vi rett på den (ingen mellomside).
  const [view, setView] = useState<ViewState>(
    initialSavedPlan ? "result" : "intro"
  );
  const [shownSavedPlan, setShownSavedPlan] = useState<MarketingPlan | null>(
    initialSavedPlan?.plan ?? null
  );
  // Hindrer at vi materialiserer den samme genererte planen flere ganger.
  const syncedRef = useRef<string | null>(null);

  const { generate, result, isPending, saved } = useToolStream<
    MarketingPlanRequest,
    MarketingPlanStream
  >({
    action: marketingPlanStreamAction,
    toolId: "marketing-plan",
    title: "Markedsplan",
    buildResult: (data) => ({ plan: data }),
    onError: () => {
      toast.error("Kunne ikke generere markedsplan. Prøv igjen.");
      setView("intro");
    },
  });

  // Materialiser quick wins som oppgaver i den delte lista. Dette er limet:
  // oppgavene dukker opp på dashbordet. `replaceSource` gjør at en ny plan
  // erstatter de forrige oppgavene i stedet for å duplisere. (Ukerutinen blir
  // bevisst IKKE oppgaver — den er en gjentakende rytme, ikke en engangsliste.)
  const materialize = useCallback(async (plan: AnyPlan) => {
    if (!plan) return;
    const quickWins = (plan.quickWins ?? []).filter(
      (w): w is string => typeof w === "string" && w.length > 0
    );

    const tasks = quickWins.map((win, i) => ({
      title: win,
      source: "marketing-plan",
      category: "Kom i gang",
      sortOrder: i,
    }));

    if (tasks.length === 0) return;
    try {
      await trpc.task.createMany.mutate({
        tasks,
        replaceSource: "marketing-plan",
      });
      toast.success("Oppgavene er lagt i lista di.");
    } catch {
      // stille — strategien vises uansett
    }
  }, []);

  // Auto-materialiser når en FERSK plan er ferdig generert og lagret (ikke når
  // en tidligere lagret plan bare åpnes — da ville vi nullstilt avhukingen).
  useEffect(() => {
    if (!saved || shownSavedPlan) return;
    if (syncedRef.current === saved.id) return;
    syncedRef.current = saved.id;
    materialize(result);
  }, [saved, result, shownSavedPlan, materialize]);

  async function handleSubmit(data: MarketingPlanRequest) {
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

  const displayedPlan = shownSavedPlan ?? result ?? undefined;

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
          >
            <PlanResult mode="intro" onStartForm={startForm} />
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
              isLoading={isPending}
              initialIndustry={initialIndustry}
              initialCompanySize={initialCompanySize}
              initialTargetAudience={initialTargetAudience}
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
            <PlanResult
              plan={displayedPlan}
              onReset={handleReset}
              mode="result"
              isStreaming={!shownSavedPlan && isPending}
              onSyncTasks={() => materialize(displayedPlan)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
