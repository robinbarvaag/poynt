"use client";

import { ToolIntro, type ToolIntroStep } from "@/components/planner/tool-intro";
import {
  type ReadinessField,
  ToolReadiness,
} from "@/components/planner/tool-readiness";
import { PlannerForm } from "@/components/yearly-planner/planner-form";
import { PlannerResult } from "@/components/yearly-planner/planner-result";
import { yearlyPlannerStreamAction } from "@/lib/planner/actions/yearly-planner";
import { useToolStream } from "@/lib/planner/use-tool-stream";
import {
  type YearlyPlan,
  type YearlyPlanStream,
  type YearlyPlannerRequest,
  audienceLabels,
} from "@poynt/planner-validators";
import { Button, PageShell, toast } from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

const YEAR_STEPS: ToolIntroStep[] = [
  {
    icon: "calendar-days",
    title: "12 måneder med innhold",
    description: "En komplett innholdsplan for hele året, måned for måned.",
  },
  {
    icon: "target",
    title: "Tilpasset bransje og sesong",
    description: "Forslag som treffer kundene dine når det er relevant.",
  },
  {
    icon: "layers",
    title: "Kanalene du velger",
    description: "Vi planlegger for kanalene og frekvensen som passer deg.",
  },
  {
    icon: "download",
    title: "Rett i kalenderen",
    description: "Eksporter hele årshjulet til kalenderen din.",
  },
];

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

  // Profil-først: bransje + målgruppe kommer fra bedriftsprofilen. Mangler de,
  // steres brukeren til å fullføre profilen først — lik logikk som de andre.
  const readinessFields: ReadinessField[] = [
    { label: "Bransje", value: initialIndustry },
    {
      label: "Målgruppe",
      value: initialAudience ? audienceLabels[initialAudience] : null,
    },
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
              icon="calendar-days"
              title="Lag årshjulet ditt"
              description="Få en komplett innholdsplan for hele året, tilpasset bransjen din og sesongene. Velg kanaler og frekvens, så setter vi sammen 12 måneder med innhold."
              steps={YEAR_STEPS}
              footnote="Ca. 3 minutter • 12 måneder med innhold"
            >
              <ToolReadiness
                fields={readinessFields}
                description={
                  isComplete
                    ? "Grunnlaget er på plass. Vi tar deg gjennom kanaler og frekvens før årshjulet lages."
                    : `Fyll inn det som mangler (${missingFields.join(", ")}), så blir årshjulet mer treffsikkert.`
                }
              >
                {isComplete ? (
                  <Button onClick={startForm} className="gap-2">
                    <Icon name="calendar-days" className="size-4" />
                    Lag mitt årshjul
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
                      Lag det likevel
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
    </PageShell>
  );
}
