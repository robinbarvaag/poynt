"use client";

import { DeclineForm } from "@/components/decline-generator/decline-form";
import { DeclineResult } from "@/components/decline-generator/decline-result";
import { trpc } from "@/lib/planner/trpc";
import type { DeclineRequest } from "@poynt/planner-validators";
import { toast } from "@poynt/ui";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

interface SavedResult {
  id: string;
  text: string;
  title: string | null;
  createdAt: Date;
}

type ViewState = "intro" | "saved" | "form" | "result";

interface DeclineGeneratorClientProps {
  initialSavedResult: SavedResult | null;
}

export function DeclineGeneratorClient({
  initialSavedResult,
}: DeclineGeneratorClientProps) {
  const [view, setView] = useState<ViewState>(
    initialSavedResult ? "saved" : "intro"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [savedResult, setSavedResult] = useState<SavedResult | null>(
    initialSavedResult
  );

  async function handleSubmit(data: DeclineRequest) {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await trpc.ai.decline.mutate(data);

      if (!response.success || response.error) {
        toast.error(response.error || "Noe gikk galt");
      } else if (response.result) {
        setResult(response.result);
        setView("result");

        // Save result to database
        try {
          const saved = await trpc.toolResult.save.mutate({
            toolId: "decline-generator",
            title: `Avslag: ${data.situationType}`,
            inputs: data as Record<string, unknown>,
            result: { text: response.result },
          });
          if (saved) {
            setSavedResult({
              id: saved.id,
              text: response.result,
              title: saved.title,
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

  function startForm() {
    setView("form");
  }

  function viewSavedResult() {
    if (savedResult) {
      setResult(savedResult.text);
      setView("result");
    }
  }

  function handleReset() {
    setResult(null);
    setView("intro");
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
        {/* Clean intro */}
        {view === "intro" && (
          <motion.div
            key="intro"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <DeclineResult mode="intro" onStartForm={startForm} />
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
            <DeclineResult
              mode="result"
              result={savedResult.text}
              toolResultId={savedResult.id}
              onReset={handleReset}
            />
          </motion.div>
        )}

        {/* Form */}
        {view === "form" && (
          <motion.div
            key="form"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                Lag et avslag
              </h1>
              <p className="text-muted-foreground mt-2">
                Fyll ut skjemaet for å få 3 varianter
              </p>
            </div>
            <DeclineForm onSubmit={handleSubmit} isLoading={isLoading} />
          </motion.div>
        )}

        {/* Result */}
        {view === "result" && result && savedResult && (
          <motion.div
            key="result"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <DeclineResult
              mode="result"
              result={result}
              toolResultId={savedResult.id}
              onReset={handleReset}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
