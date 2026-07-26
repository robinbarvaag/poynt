"use client";

import { GuideQuiz } from "@/components/channel-guide/guide-quiz";
import { GuideResult } from "@/components/channel-guide/guide-result";
import { ToolIntro, type ToolIntroStep } from "@/components/planner/tool-intro";
import {
  type ReadinessField,
  ToolReadiness,
} from "@/components/planner/tool-readiness";
import { stepFade } from "@/lib/motion-variants";
import { channelGuideStreamAction } from "@/lib/planner/actions/channel-guide";
import { useToolStream } from "@/lib/planner/use-tool-stream";
import type {
  ChannelGuideClientProps,
  ChannelRecommendation,
  ViewState,
} from "@/lib/types";
import type {
  ChannelGuideRequest,
  ChannelGuideStream,
} from "@poynt/planner-validators";
import {
  mainGoalLabels,
  strengthLabels,
  targetAudienceLabels,
  weeklyTimeLabels,
} from "@poynt/planner-validators";
import { Button, PageShell, toast } from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

const CHANNEL_STEPS: ToolIntroStep[] = [
  {
    icon: "target",
    title: "Prioriterte kanaler",
    description:
      "Hvilke kanaler du bør satse på, rangert etter hva som gir mest igjen for innsatsen.",
  },
  {
    icon: "compass",
    title: "Konkret handling",
    description: "Hvor ofte og nøyaktig hvilke aktiviteter du gjør per kanal.",
  },
  {
    icon: "arrow-right",
    title: "Neste steg",
    description: "En tydelig liste å starte med, klar til å sette i gang.",
  },
];

export function ChannelGuideClient({
  initialSavedResult,
  industries,
  profile,
}: ChannelGuideClientProps) {
  // Hvilke påkrevde profilfelt mangler? Driver «profil-først» uten å dumpe
  // brukeren i en 6-stegs wizard når noe mangler — vi viser i stedet hva som
  // gjenstår og lenker til profilen.
  const missingFields = [
    !profile.industryId && "Bransje",
    !profile.audienceType && "Målgruppe",
    !profile.mainGoal && "Hovedmål",
    !profile.weeklyTime && "Tid per uke",
    !profile.strengths && "Din styrke",
  ].filter((field): field is string => Boolean(field));
  const isComplete = missingFields.length === 0;

  const [view, setView] = useState<ViewState>(
    initialSavedResult ? "saved" : "ready"
  );

  // Streaming-generering via server action + RSC streamable value. `result`
  // (delobjekt) fylles inn bit for bit mens svaret genereres.
  const { generate, result, isPending } = useToolStream<
    ChannelGuideRequest,
    ChannelGuideStream
  >({
    action: channelGuideStreamAction,
    toolId: "channel-guide",
    title: "Kanalanbefaling",
    buildResult: (data) => ({
      channels: data.channels,
      reasoning: data.reasoning,
      nextSteps: data.nextSteps,
    }),
    onError: () => {
      toast.error("Kunne ikke generere anbefalinger. Prøv igjen.");
      setView("ready");
    },
  });

  function runGeneration(request: ChannelGuideRequest) {
    setView("result");
    generate(request);
  }

  /** Bygger en forespørsel direkte fra bedriftsprofilen (profil-først). */
  function buildRequestFromProfile(): ChannelGuideRequest | null {
    const { industryId, audienceType, mainGoal, weeklyTime, strengths } =
      profile;
    if (
      !industryId ||
      !audienceType ||
      !mainGoal ||
      !weeklyTime ||
      !strengths
    ) {
      return null;
    }
    return {
      industryId,
      targetAudience: audienceType,
      mainGoal,
      weeklyTime,
      strengths,
      previousChannels: [],
      previousExperience: "",
    };
  }

  function handleGenerate() {
    const request = buildRequestFromProfile();
    if (!request) {
      toast.error("Profilen mangler noen felt — juster forutsetningene.");
      setView("quiz");
      return;
    }
    runGeneration(request);
  }

  async function handleSubmit(data: ChannelGuideRequest) {
    runGeneration(data);
  }

  function handleReset() {
    setView("ready");
  }

  function startQuiz() {
    setView("quiz");
  }

  // Profilfelt for readiness-kortet («dette bruker vi om deg»).
  const readinessFields: ReadinessField[] = [
    { label: "Bransje", value: profile.industryName },
    {
      label: "Målgruppe",
      value: profile.audienceType
        ? targetAudienceLabels[profile.audienceType]
        : null,
    },
    {
      label: "Hovedmål",
      value: profile.mainGoal ? mainGoalLabels[profile.mainGoal] : null,
    },
    {
      label: "Tid per uke",
      value: profile.weeklyTime ? weeklyTimeLabels[profile.weeklyTime] : null,
    },
    {
      label: "Din styrke",
      value: profile.strengths ? strengthLabels[profile.strengths] : null,
    },
  ];

  // Delobjektet under streaming → display-kontrakten (GuideResult vokter på
  // manglende felter; filtrer bort ev. udefinerte steg som ennå streamer inn).
  const resultChannels = (result?.channels ??
    []) as unknown as ChannelRecommendation[];
  const resultNextSteps = ((result?.nextSteps ?? []) as string[]).filter(
    Boolean
  );

  return (
    <PageShell>
      <AnimatePresence mode="wait">
        {view === "ready" && (
          <motion.div
            key="ready"
            variants={stepFade}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <ToolIntro
              icon="compass"
              title="Finn dine riktige markedsføringskanaler"
              description="Vi bruker det vi vet om bedriften din til å peke ut kanalene som faktisk passer. Jo mer komplett profilen er, desto mer treffsikker blir anbefalingen."
              steps={CHANNEL_STEPS}
              footnote="Bygger på bedriftsprofilen din • Tar under ett minutt"
            >
              <ToolReadiness
                fields={readinessFields}
                description={
                  isComplete
                    ? "Alt vi trenger er på plass — generer når du vil."
                    : `Fyll inn det som mangler (${missingFields.join(", ")}), så blir anbefalingen mer treffsikker.`
                }
              >
                {isComplete ? (
                  <>
                    <Button onClick={handleGenerate} className="gap-2">
                      <Icon name="compass" className="size-4" />
                      Generer anbefaling
                    </Button>
                    <Button
                      variant="outline"
                      onClick={startQuiz}
                      className="gap-2"
                    >
                      <Icon name="settings" className="size-4" />
                      Juster forutsetninger
                    </Button>
                  </>
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
                      onClick={startQuiz}
                      className="gap-2"
                    >
                      Svar på spørsmålene i stedet
                    </Button>
                  </>
                )}
              </ToolReadiness>
            </ToolIntro>
          </motion.div>
        )}

        {view === "saved" && initialSavedResult && (
          <motion.div
            key="saved"
            variants={stepFade}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <GuideResult
              channels={initialSavedResult.channels}
              reasoning={initialSavedResult.reasoning || null}
              nextSteps={initialSavedResult.nextSteps || null}
              onReset={handleReset}
            />
          </motion.div>
        )}

        {view === "quiz" && (
          <motion.div
            key="quiz"
            variants={stepFade}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <GuideQuiz
              onSubmit={handleSubmit}
              isLoading={isPending}
              industries={industries}
              initialIndustryId={profile.industryId}
              initialTargetAudience={profile.audienceType}
            />
          </motion.div>
        )}

        {view === "result" && (
          <motion.div
            key="result"
            variants={stepFade}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <GuideResult
              channels={resultChannels}
              reasoning={result?.reasoning ?? null}
              nextSteps={resultNextSteps}
              onReset={handleReset}
              isStreaming={isPending}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
