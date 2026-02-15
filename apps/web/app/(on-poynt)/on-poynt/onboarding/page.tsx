"use client";

import { Button } from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Step = "workspace" | "tour" | "complete";

const features = [
  {
    icon: "file-text" as const,
    title: "Innhold og tips",
    description:
      "Artikler og markedsføringsguider for å lære best practice",
  },
  {
    icon: "compass" as const,
    title: "Kanalveileder",
    description:
      "AI-drevet anbefalinger for hvilke markedsføringskanaler som passer din bedrift",
  },
  {
    icon: "calendar" as const,
    title: "Markedsplan",
    description: "Månedlig markedsføringsplan generert med AI",
  },
  {
    icon: "calendar-days" as const,
    title: "Årsplanlegger",
    description:
      "Årlig innholdskalender for å holde oversikt over markedsføringen din",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("workspace");
  const [workspaceName, setWorkspaceName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleWorkspaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // TODO: Call tRPC to create workspace
      // For now, skip to next step
      setCurrentStep("tour");
    } catch {
      setError("Kunne ikke opprette bedrift. Prøv igjen.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Mark onboarding as completed
      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to complete onboarding");
      }

      // Redirect to dashboard
      router.push("/on-poynt/oversikt");
    } catch {
      setError("Kunne ikke fullføre onboarding. Prøv igjen.");
      setIsLoading(false);
    }
  };

  const getStepNumber = (step: Step) => {
    switch (step) {
      case "workspace":
        return 1;
      case "tour":
        return 2;
      case "complete":
        return 3;
    }
  };

  const currentStepNumber = getStepNumber(currentStep);
  const totalSteps = 3;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">
              Steg {currentStepNumber} av {totalSteps}
            </span>
            <span className="text-sm text-slate-500">
              {Math.round((currentStepNumber / totalSteps) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-900 transition-all duration-300"
              style={{ width: `${(currentStepNumber / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Content Card */}
        <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          {/* Step 1: Workspace Setup */}
          {currentStep === "workspace" && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-slate-900">
                  Opprett din bedrift
                </h1>
                <p className="mt-2 text-slate-600">
                  Gi bedriften din et navn for å komme i gang
                </p>
              </div>

              <form onSubmit={handleWorkspaceSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="workspaceName"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    Bedriftsnavn
                  </label>
                  <input
                    id="workspaceName"
                    type="text"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    required
                    className="block w-full rounded-md border border-slate-300 px-4 py-3 text-sm shadow-sm transition-colors focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                    placeholder="Min bedrift AS"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={isLoading || !workspaceName.trim()}
                    className="flex-1"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Icon name="loader" className="mr-2 size-4 animate-spin" />
                        Oppretter...
                      </>
                    ) : (
                      <>
                        Neste
                        <Icon name="arrow-right" className="ml-2 size-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Step 2: Feature Tour */}
          {currentStep === "tour" && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-slate-900">
                  Hva kan du gjøre på On Poynt?
                </h1>
                <p className="mt-2 text-slate-600">
                  Utforsk verktøyene som hjelper deg med markedsføringen
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {features.map((feature) => (
                  <div
                    key={feature.title}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-5 transition-colors hover:bg-slate-100"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-900">
                        <Icon
                          name={feature.icon}
                          className="size-5 text-white"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900">
                          {feature.title}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep("workspace")}
                  size="lg"
                >
                  <Icon name="arrow-left" className="mr-2 size-4" />
                  Tilbake
                </Button>
                <Button
                  onClick={() => setCurrentStep("complete")}
                  className="flex-1"
                  size="lg"
                >
                  Neste
                  <Icon name="arrow-right" className="ml-2 size-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Completion */}
          {currentStep === "complete" && (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-green-100">
                  <Icon name="check" className="size-8 text-green-600" />
                </div>
              </div>

              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Du er klar!
                </h1>
                <p className="mt-2 text-slate-600">
                  Alt er satt opp og klart. La oss komme i gang med
                  markedsføringen din.
                </p>
              </div>

              {error && (
                <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep("tour")}
                  disabled={isLoading}
                  size="lg"
                >
                  <Icon name="arrow-left" className="mr-2 size-4" />
                  Tilbake
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={isLoading}
                  className="flex-1"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Icon name="loader" className="mr-2 size-4 animate-spin" />
                      Fullfører...
                    </>
                  ) : (
                    <>
                      Gå til oversikten
                      <Icon name="arrow-right" className="ml-2 size-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
