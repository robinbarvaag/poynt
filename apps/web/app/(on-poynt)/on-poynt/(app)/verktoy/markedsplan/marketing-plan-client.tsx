"use client";

import { PlanForm } from "@/components/marketing-plan/plan-form";
import { PlanResult } from "@/components/marketing-plan/plan-result";
import { ToolIntro, type ToolIntroStep } from "@/components/planner/tool-intro";
import {
  type ReadinessField,
  ToolReadiness,
} from "@/components/planner/tool-readiness";
import { marketingPlanStreamAction } from "@/lib/planner/actions/marketing-plan";
import { trpc } from "@/lib/planner/trpc";
import { useToolStream } from "@/lib/planner/use-tool-stream";
import {
  type MarketingPlan,
  type MarketingPlanRequest,
  type MarketingPlanStream,
  profileCompanySizeLabels,
} from "@poynt/planner-validators";
import { Button, PageShell, toast } from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import type { DeepPartial } from "ai";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const PLAN_STEPS: ToolIntroStep[] = [
  {
    icon: "target",
    title: "Prioriterte kanaler",
    description:
      "Hvilke kanaler du bør satse på, hvor ofte, og konkret hva du skal gjøre.",
  },
  {
    icon: "calendar",
    title: "Utrullingsplan",
    description: "Måned-for-måned med fokusområder og konkrete steg.",
  },
  {
    icon: "clock",
    title: "Ukentlig rutine",
    description: "Forslag til en fast ukesplan med tidsestimat.",
  },
  {
    icon: "zap",
    title: "Oppgaver rett i lista",
    description:
      "Quick wins legges automatisk i oppgavelista på dashbordet, klare til avhuking.",
  },
];

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

// Utrullingsplanens faser materialiseres under en egen source, slik at de ikke
// kolliderer med quick wins («marketing-plan») og kan hentes inn fase for fase.
const TIMELINE_SOURCE = "marketing-plan-timeline";

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
  // Hvilke utrullingsfaser er allerede hentet inn som oppgaver (etter månedsnavn).
  const [pulledPhases, setPulledPhases] = useState<Set<string>>(new Set());

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

  // Hent hvilke utrullingsfaser som allerede ligger i oppgavelista, så hver fase
  // viser «Lagt i oppgavene» i stedet for «Legg i oppgavene».
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const rows = await trpc.task.list.query({ source: TIMELINE_SOURCE });
        if (!active) return;
        setPulledPhases(
          new Set(
            rows.map((r) => r.category).filter((c): c is string => Boolean(c))
          )
        );
      } catch {
        // stille — knappene faller tilbake til «Legg i oppgavene»
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Hent inn én utrullingsfase som oppgaver (progressivt — én fase om gangen).
  const pullPhase = useCallback(
    async (phase: { label: string; tasks: string[] }) => {
      if (!phase.label || phase.tasks.length === 0) return;
      setPulledPhases((s) => new Set(s).add(phase.label)); // optimistisk
      try {
        await trpc.task.addPhase.mutate({
          source: TIMELINE_SOURCE,
          category: phase.label,
          tasks: phase.tasks,
        });
        toast.success(`«${phase.label}» lagt i oppgavelista.`);
      } catch {
        setPulledPhases((s) => {
          const next = new Set(s);
          next.delete(phase.label);
          return next;
        });
        toast.error("Kunne ikke legge fasen i oppgavelista.");
      }
    },
    []
  );

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

  // Profil-først: bygger på bedriftsprofilen, akkurat som kanalveilederen.
  // Mangler kjernefeltene, steres brukeren til å fullføre profilen først.
  const readinessFields: ReadinessField[] = [
    { label: "Bransje", value: initialIndustry },
    {
      label: "Størrelse",
      value: initialCompanySize
        ? profileCompanySizeLabels[initialCompanySize]
        : null,
    },
    { label: "Målgruppe", value: initialTargetAudience?.trim() || null },
  ];
  const missingFields = readinessFields
    .filter((f) => !f.value)
    .map((f) => f.label);
  const isComplete = missingFields.length === 0;

  return (
    <PageShell>
      <AnimatePresence mode="wait">
        {view === "intro" && (
          <motion.div
            key="intro"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <ToolIntro
              icon="bar-chart"
              title="Lag din skreddersydde markedsplan"
              description="Slutt å gjette hva du skal gjøre. Vi bygger en komplett strategi tilpasset bransjen, målet og ressursene dine — og legger oppgavene rett i lista di."
              steps={PLAN_STEPS}
              footnote="Ca. 1 minutt • Bygger på bedriftsprofilen din"
            >
              <ToolReadiness
                fields={readinessFields}
                description={
                  isComplete
                    ? "Grunnlaget er på plass. Vi tar deg gjennom et par siste valg før planen lages."
                    : `Fyll inn det som mangler (${missingFields.join(", ")}), så blir planen mer treffsikker.`
                }
              >
                {isComplete ? (
                  <Button onClick={startForm} className="gap-2">
                    <Icon name="bar-chart" className="size-4" />
                    Lag markedsplan
                  </Button>
                ) : (
                  <>
                    <Button asChild className="gap-2">
                      <Link href="/on-poynt/bedrifter">
                        <Icon name="building-2" className="size-4" />
                        Fullfør bedriftsprofilen
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={startForm}
                      className="gap-2"
                    >
                      Lag planen likevel
                    </Button>
                  </>
                )}
              </ToolReadiness>
            </ToolIntro>
          </motion.div>
        )}

        {view === "form" && (
          <motion.div
            key="form"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
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
              isStreaming={!shownSavedPlan && isPending}
              onSyncTasks={() => materialize(displayedPlan)}
              pulledPhases={pulledPhases}
              onPullPhase={pullPhase}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
