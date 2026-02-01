"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GuideQuiz } from "@/components/channel-guide/guide-quiz";
import { GuideResult } from "@/components/channel-guide/guide-result";
import { trpc } from "@/lib/planner/trpc";
import type { ChannelGuideRequest } from "@poynt/planner-validators";
import { toast } from "@poynt/ui";
import type { Industry } from "./page";

interface ChannelRecommendation {
  name: string;
  matchPercent: number;
  reason: string;
}

interface SavedResult {
  id: string;
  channels: ChannelRecommendation[];
  reasoning?: string;
  createdAt: Date;
}

type ViewState = "intro" | "saved" | "quiz" | "result";

// Medal config for the 3 channels
type MedalConfig = {
  icon: "trophy" | "medal" | "award";
  color: string;
  bg: string;
};

const medalConfigs: MedalConfig[] = [
  { icon: "trophy", color: "text-yellow-500", bg: "bg-yellow-500/10" },
  { icon: "medal", color: "text-slate-400", bg: "bg-slate-400/10" },
  { icon: "award", color: "text-amber-600", bg: "bg-amber-600/10" },
];

interface ChannelGuideClientProps {
  initialSavedResult: SavedResult | null;
  industries: Industry[];
  initialIndustryId: string | null;
  initialTargetAudience: "b2b" | "b2c" | "both" | null;
}

export function ChannelGuideClient({
  initialSavedResult,
  industries,
  initialIndustryId,
  initialTargetAudience,
}: ChannelGuideClientProps) {
  const [view, setView] = useState<ViewState>(
    initialSavedResult ? "saved" : "intro"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ChannelRecommendation[] | null>(null);
  const [reasoning, setReasoning] = useState<string | null>(null);
  const [savedResult, setSavedResult] = useState<SavedResult | null>(initialSavedResult);

  async function handleSubmit(data: ChannelGuideRequest) {
    setIsLoading(true);

    try {
      const response = await trpc.ai.channelGuide.mutate(data);

      if (!response.success || response.error) {
        toast.error(response.error || "Noe gikk galt. Prøv igjen.");
      } else if (response.channels) {
        setResults(response.channels);
        setReasoning(response.reasoning || null);
        setView("result");

        try {
          const saved = await trpc.toolResult.save.mutate({
            toolId: "channel-guide",
            title: "Kanalanbefaling",
            inputs: data as Record<string, unknown>,
            result: {
              channels: response.channels,
              reasoning: response.reasoning,
            },
          });
          if (saved) {
            setSavedResult({
              id: saved.id,
              channels: response.channels,
              reasoning: response.reasoning,
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
    setResults(null);
    setReasoning(null);
    setView("intro");
  }

  function startQuiz() {
    setView("quiz");
  }

  function viewSavedResult() {
    if (savedResult) {
      setResults(savedResult.channels);
      setReasoning(savedResult.reasoning || null);
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
          >
            <GuideResult
              channels={[]}
              reasoning={null}
              onReset={handleReset}
              mode="intro"
              onStartQuiz={startQuiz}
            />
          </motion.div>
        )}

        {view === "saved" && savedResult && (
          <motion.div
            key="saved"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <GuideResult
              channels={savedResult.channels}
              reasoning={savedResult.reasoning || null}
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
              isLoading={isLoading}
              industries={industries}
              initialIndustryId={initialIndustryId}
              initialTargetAudience={initialTargetAudience}
            />
          </motion.div>
        )}

        {view === "result" && results && (
          <motion.div
            key="result"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <GuideResult
              channels={results}
              reasoning={reasoning}
              onReset={handleReset}
              mode="result"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
