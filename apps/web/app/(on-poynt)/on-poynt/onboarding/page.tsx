"use client";

import { Button, Card, Heading, Input, Progress, Text } from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Step = "workspace" | "tour" | "complete";

const features = [
  {
    icon: "file-text" as const,
    title: "Innhold og tips",
    description: "Guider og kurs for å lære best practice",
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

  // Forhåndsutfyll bedriftsnavnet fra en godkjent medlemskapssøknad.
  useEffect(() => {
    let active = true;
    fetch("/api/onboarding/complete")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.companyName) {
          setWorkspaceName((current) => current || data.companyName);
        }
      })
      .catch(() => {
        // Stille feil – prefill er bare en bekvemmelighet.
      });
    return () => {
      active = false;
    };
  }, []);

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
      // Create workspace and mark onboarding as completed
      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceName }),
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">
              Steg {currentStepNumber} av {totalSteps}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round((currentStepNumber / totalSteps) * 100)}%
            </span>
          </div>
          <Progress
            value={(currentStepNumber / totalSteps) * 100}
            className="h-2"
          />
        </div>

        <Card className="p-8">
          {currentStep === "workspace" && (
            <div className="space-y-6">
              <div className="text-center">
                <Heading size="h2">Opprett din bedrift</Heading>
                <Text variant="muted" customStyles="mt-2">
                  Gi bedriften din et navn for å komme i gang
                </Text>
              </div>

              <form onSubmit={handleWorkspaceSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="workspaceName"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Bedriftsnavn
                  </label>
                  <Input
                    id="workspaceName"
                    type="text"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    required
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
                        <Icon
                          name="loader"
                          className="mr-2 size-4 animate-spin"
                        />
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

          {currentStep === "tour" && (
            <div className="space-y-6">
              <div className="text-center">
                <Heading size="h2">Hva kan du gjøre på On Poynt?</Heading>
                <Text variant="muted" customStyles="mt-2">
                  Utforsk verktøyene som hjelper deg med markedsføringen
                </Text>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {features.map((feature) => (
                  <Card
                    key={feature.title}
                    className="bg-muted p-5 transition-colors hover:bg-muted/70"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon name={feature.icon} className="size-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">
                          {feature.title}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </Card>
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
                <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
                  <Icon name="check" className="size-8 text-primary" />
                </div>
              </div>

              <div>
                <Heading size="h2">Du er klar!</Heading>
                <Text variant="muted" customStyles="mt-2">
                  Alt er satt opp og klart. La oss komme i gang med
                  markedsføringen din.
                </Text>
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
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
                      <Icon
                        name="loader"
                        className="mr-2 size-4 animate-spin"
                      />
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
        </Card>
      </div>
    </div>
  );
}
