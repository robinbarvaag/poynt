"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  type ChannelGuideRequest,
  channelGuideRequestSchema,
  mainGoalLabels,
  mainGoalTypes,
  previousChannelLabels,
  previousChannelTypes,
  strengthLabels,
  strengthTypes,
  targetAudienceLabels,
  targetAudienceTypes,
  weeklyTimeLabels,
  weeklyTimeTypes,
} from "@poynt/planner-validators";
import { Button } from "@poynt/ui";
import { CardContent } from "@poynt/ui";
import { Textarea } from "@poynt/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@poynt/ui";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@poynt/ui";
import { cn } from "@poynt/ui";
import { OptionCard, PrefilledBadge, StepContainer } from "@poynt/ui";
import { Icon, type IconName } from "@poynt/ui/icons";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useForm } from "react-hook-form";

interface Industry {
  id: string;
  name: string;
  icon: string | null;
  isActive: boolean;
}

interface GuideQuizProps {
  onSubmit: (data: ChannelGuideRequest) => Promise<void>;
  isLoading: boolean;
  industries: Industry[];
  initialIndustryId: string | null;
  initialTargetAudience: "b2b" | "b2c" | "both" | null;
}

const TOTAL_STEPS = 6;

const stepIcons: IconName[] = [
  "building-2",
  "users",
  "target",
  "clock",
  "palette",
  "message-square",
];

const stepTitles = [
  "Hvilken bransje jobber du i?",
  "Hvem er målgruppen din?",
  "Hva er hovedmålet ditt?",
  "Hvor mye tid har du per uke?",
  "Hva er din styrke?",
  "Tidligere erfaring",
];

const stepDescriptions = [
  "Fortell oss litt om bransjen din, så finner vi de beste kanalene for deg.",
  "Vi tilpasser anbefalingene basert på hvem du ønsker å nå.",
  "Ulike mål krever ulike strategier og kanaler.",
  "Vi anbefaler kanaler som passer din kapasitet.",
  "Spill på styrkene dine for best resultater.",
  "Har du prøvd noen kanaler tidligere? (valgfritt)",
];

export function GuideQuiz({
  onSubmit,
  isLoading,
  industries,
  initialIndustryId,
  initialTargetAudience,
}: GuideQuizProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const form = useForm<ChannelGuideRequest>({
    resolver: zodResolver(channelGuideRequestSchema),
    defaultValues: {
      industryId: initialIndustryId ?? "",
      targetAudience: initialTargetAudience ?? undefined,
      mainGoal: undefined,
      weeklyTime: undefined,
      strengths: undefined,
      previousChannels: [],
      previousExperience: "",
    },
    mode: "onChange",
  });

  const hasPrefilledIndustry = !!initialIndustryId;
  const hasPrefilledAudience = !!initialTargetAudience;

  const progressValue = ((currentStep + 1) / TOTAL_STEPS) * 100;

  const stepIconName = stepIcons[currentStep] ?? "building-2";

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return form.watch("industryId")?.length > 0;
      case 1:
        return form.watch("targetAudience") !== undefined;
      case 2:
        return form.watch("mainGoal") !== undefined;
      case 3:
        return form.watch("weeklyTime") !== undefined;
      case 4:
        return form.watch("strengths") !== undefined;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const goNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  const targetAudienceIcons: Record<string, IconName> = {
    b2b: "briefcase",
    b2c: "user-circle",
    both: "handshake",
  };

  const mainGoalIcons: Record<string, IconName> = {
    leads: "mail",
    sales: "dollar",
    awareness: "megaphone",
    recruitment: "user-plus",
  };

  const weeklyTimeIcons: Record<string, IconName> = {
    "1-2h": "zap",
    "3-5h": "flame",
    "5h+": "rocket",
  };

  const strengthIcons: Record<string, IconName> = {
    writing: "pen-tool",
    speaking: "mic",
    visual: "image",
    mixed: "layers",
  };

  const channelIcons: Record<string, IconName> = {
    linkedin: "linkedin",
    instagram: "instagram",
    facebook: "facebook",
    tiktok: "music",
    youtube: "youtube",
    email: "mail",
    podcast: "headphones",
    none: "circle-off",
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <FormField
            control={form.control}
            name="industryId"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between mb-2">
                  <FormLabel>Bransje</FormLabel>
                  {hasPrefilledIndustry && (
                    <PrefilledBadge fieldName="Bransje" />
                  )}
                </div>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Velg din bransje..." />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((ind) => (
                        <SelectItem key={ind.id} value={ind.id}>
                          {ind.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 1:
        return (
          <FormField
            control={form.control}
            name="targetAudience"
            render={({ field }) => (
              <FormItem>
                {hasPrefilledAudience && (
                  <div className="mb-3">
                    <PrefilledBadge fieldName="Målgruppe" />
                  </div>
                )}
                <FormControl>
                  <div className="grid gap-3">
                    {targetAudienceTypes.map((type) => (
                      <OptionCard
                        key={type}
                        value={type}
                        label={targetAudienceLabels[type]}
                        icon={targetAudienceIcons[type]}
                        isSelected={field.value === type}
                        onClick={() => field.onChange(type)}
                      />
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 2:
        return (
          <FormField
            control={form.control}
            name="mainGoal"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="grid gap-3">
                    {mainGoalTypes.map((type) => (
                      <OptionCard
                        key={type}
                        value={type}
                        label={mainGoalLabels[type]}
                        icon={mainGoalIcons[type]}
                        isSelected={field.value === type}
                        onClick={() => field.onChange(type)}
                      />
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 3:
        return (
          <FormField
            control={form.control}
            name="weeklyTime"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="grid gap-3">
                    {weeklyTimeTypes.map((type) => (
                      <OptionCard
                        key={type}
                        value={type}
                        label={weeklyTimeLabels[type]}
                        icon={weeklyTimeIcons[type]}
                        isSelected={field.value === type}
                        onClick={() => field.onChange(type)}
                      />
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 4:
        return (
          <FormField
            control={form.control}
            name="strengths"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="grid gap-3">
                    {strengthTypes.map((type) => (
                      <OptionCard
                        key={type}
                        value={type}
                        label={strengthLabels[type]}
                        icon={strengthIcons[type]}
                        isSelected={field.value === type}
                        onClick={() => field.onChange(type)}
                      />
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 5:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="previousChannels"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">
                    Hvilke kanaler har du brukt tidligere?
                  </FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-2 gap-3">
                      {previousChannelTypes.map((channel) => {
                        const isChecked =
                          field.value?.includes(channel) || false;
                        return (
                          <button
                            key={channel}
                            type="button"
                            aria-pressed={isChecked}
                            className={cn(
                              "ring-foreground/10 bg-card text-card-foreground w-full rounded-xl py-4 text-left text-sm ring-1",
                              "cursor-pointer transition-all duration-200 hover:scale-[1.02]",
                              isChecked
                                ? "ring-2 ring-primary bg-primary/5 border-primary"
                                : "hover:border-primary/50"
                            )}
                            onClick={(e) => {
                              e.preventDefault();
                              const current = field.value || [];
                              if (channel === "none") {
                                field.onChange(isChecked ? [] : ["none"]);
                              } else {
                                const withoutNone = current.filter(
                                  (c) => c !== "none"
                                );
                                if (isChecked) {
                                  field.onChange(
                                    withoutNone.filter((c) => c !== channel)
                                  );
                                } else {
                                  field.onChange([...withoutNone, channel]);
                                }
                              }
                            }}
                          >
                            <CardContent className="flex items-center gap-3 p-3">
                              {(() => {
                                const channelIconName = channelIcons[channel];
                                return channelIconName ? (
                                  <div
                                    className={cn(
                                      "size-8 rounded-md flex items-center justify-center",
                                      isChecked
                                        ? "bg-primary/10 text-primary"
                                        : "bg-muted text-muted-foreground"
                                    )}
                                  >
                                    <Icon
                                      name={channelIconName}
                                      className="size-4"
                                    />
                                  </div>
                                ) : null;
                              })()}
                              <div
                                className={cn(
                                  "size-4 shrink-0 rounded border shadow-xs flex items-center justify-center",
                                  isChecked
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-input"
                                )}
                              >
                                {isChecked && (
                                  <svg
                                    className="size-3"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={3}
                                    aria-hidden="true"
                                    focusable={false}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                )}
                              </div>
                              <span
                                className={cn(
                                  "text-sm font-medium",
                                  isChecked && "text-primary"
                                )}
                              >
                                {previousChannelLabels[channel]}
                              </span>
                            </CardContent>
                          </button>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="previousExperience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">
                    Fortell mer om din erfaring (valgfritt)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Hva har fungert? Hva har ikke fungert?"
                      className="min-h-25 resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const handleAnalyze = () => {
    // Manuell submit - kun mulig på siste steg
    if (currentStep === TOTAL_STEPS - 1) {
      form.handleSubmit(onSubmit)();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
        <StepContainer
          currentStep={currentStep}
          totalSteps={TOTAL_STEPS}
          stepIcon={stepIconName}
          stepTitle={stepTitles[currentStep] ?? ""}
          stepDescription={stepDescriptions[currentStep] ?? ""}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </StepContainer>

        <div className="flex items-center justify-between pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={goBack}
            disabled={currentStep === 0}
            className={cn(currentStep === 0 && "invisible")}
          >
            <Icon name="arrow-left" className="size-4 mr-2" />
            Tilbake
          </Button>

          {currentStep < TOTAL_STEPS - 1 ? (
            <Button
              type="button"
              onClick={goNext}
              disabled={!canProceed()}
              className="min-w-35"
            >
              Neste
              <Icon name="arrow-right" className="size-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleAnalyze}
              disabled={isLoading}
              className="min-w-40 bg-linear-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              {isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                    }}
                  >
                    <Icon name="loader" className="size-4 animate-spin mr-2" />
                  </motion.div>
                  Analyserer...
                </>
              ) : (
                <>
                  <Icon name="sparkles" className="size-4 mr-2" />
                  Se resultater
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
