"use client";

import { GuideQuiz } from "@/components/channel-guide/guide-quiz";
import { GuideResult } from "@/components/channel-guide/guide-result";
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
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Heading,
  Text,
  toast,
} from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

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

  // Chips for «dette vet vi om deg».
  const profileChips = [
    profile.industryName,
    profile.audienceType ? targetAudienceLabels[profile.audienceType] : null,
    profile.mainGoal ? mainGoalLabels[profile.mainGoal] : null,
    profile.weeklyTime ? weeklyTimeLabels[profile.weeklyTime] : null,
    profile.strengths ? strengthLabels[profile.strengths] : null,
  ].filter((chip): chip is string => Boolean(chip));

  // Delobjektet under streaming → display-kontrakten (GuideResult vokter på
  // manglende felter; filtrer bort ev. udefinerte steg som ennå streamer inn).
  const resultChannels = (result?.channels ??
    []) as unknown as ChannelRecommendation[];
  const resultNextSteps = ((result?.nextSteps ?? []) as string[]).filter(
    Boolean
  );

  return (
    <div className="container py-12 md:py-16">
      <AnimatePresence mode="wait">
        {view === "ready" && (
          <motion.div
            key="ready"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="mx-auto max-w-3xl space-y-6">
              <div className="space-y-3 text-center">
                <div className="mx-auto inline-flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon name="compass" className="size-8" />
                </div>
                <Heading size="h1">
                  Finn dine riktige markedsføringskanaler
                </Heading>
                <Text>
                  Vi bruker det vi vet om bedriften din. Jo mer komplett
                  profilen er, desto mer treffsikker blir anbefalingen.
                </Text>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Dette vet vi om deg</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {profileChips.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {profileChips.map((chip) => (
                        <Badge key={chip} variant="muted" size="md">
                          {chip}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {isComplete ? (
                    <>
                      <div className="flex flex-col gap-3 sm:flex-row">
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
                      </div>

                      <Button
                        asChild
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-muted-foreground"
                      >
                        <Link href="/on-poynt/bedrifter">
                          Rediger bedriftsprofilen
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                        <p className="text-sm font-medium">
                          For en treffsikker anbefaling mangler vi:
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {missingFields.map((field) => (
                            <Badge key={field} variant="outline" size="sm">
                              {field}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row">
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
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {view === "saved" && initialSavedResult && (
          <motion.div
            key="saved"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <GuideResult
              channels={initialSavedResult.channels}
              reasoning={initialSavedResult.reasoning || null}
              nextSteps={initialSavedResult.nextSteps || null}
              onReset={handleReset}
              mode="result"
            />
          </motion.div>
        )}

        {view === "quiz" && (
          <motion.div
            key="quiz"
            variants={fadeIn}
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
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <GuideResult
              channels={resultChannels}
              reasoning={result?.reasoning ?? null}
              nextSteps={resultNextSteps}
              onReset={handleReset}
              mode="result"
              isStreaming={isPending}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
