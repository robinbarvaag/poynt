"use client";

import {
  type MarketingPlanRequest,
  budgetLabels,
  budgetTypes,
  companySizeLabels,
  companySizeTypes,
  existingActivityLabels,
  existingActivityTypes,
  marketingGoalLabels,
  marketingGoalTypes,
  marketingPlanRequestSchema,
  timeframeLabels,
  timeframeTypes,
} from "@poynt/planner-validators";
import { Button } from "@poynt/ui";
import { Textarea } from "@poynt/ui";
import { Input } from "@poynt/ui";
import { Checkbox } from "@poynt/ui";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@poynt/ui";
import { cn } from "@poynt/ui";
import { OptionCard, StepContainer } from "@poynt/ui";
import { useForm, zodResolver } from "@poynt/ui/form";
import { Icon, type IconName } from "@poynt/ui/icons";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

type CompanySize = "solo" | "small" | "medium" | "large";

interface PlanFormProps {
  onSubmit: (data: MarketingPlanRequest) => Promise<void>;
  isLoading: boolean;
  initialIndustry?: string | null;
  initialCompanySize?: CompanySize | null;
  initialTargetAudience?: string | null;
}

const TOTAL_STEPS = 5;

const stepIcons: IconName[] = [
  "building-2",
  "target",
  "calendar",
  "wallet",
  "layout-list",
];

const stepTitles = [
  "Fortell oss om bedriften",
  "Hva er hovedmålet ditt?",
  "Hvor lang plan ønsker du?",
  "Hva er budsjettet?",
  "Detaljer (valgfritt)",
];

const stepDescriptions = [
  "Bransje og størrelse hjelper oss å tilpasse planen.",
  "Vi fokuserer strategien rundt målet ditt.",
  "Kort sprint eller langsiktig plan – du bestemmer.",
  "Vi tilpasser aktivitetene til ressursene dine.",
  "Ekstra info gir en mer presis plan.",
];

export function PlanForm({
  onSubmit,
  isLoading,
  initialIndustry,
  initialCompanySize,
  initialTargetAudience,
}: PlanFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const form = useForm<MarketingPlanRequest>({
    resolver: zodResolver(marketingPlanRequestSchema),
    defaultValues: {
      industry: initialIndustry ?? "",
      companySize: initialCompanySize ?? undefined,
      mainGoal: undefined,
      timeframe: undefined,
      budget: undefined,
      existingActivities: [],
      targetAudienceDescription: initialTargetAudience ?? "",
      competitors: "",
    },
    mode: "onChange",
  });

  const stepIconName = stepIcons[currentStep] ?? "building-2";

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return (
          form.watch("industry")?.trim().length > 0 &&
          form.watch("companySize") !== undefined
        );
      case 1:
        return form.watch("mainGoal") !== undefined;
      case 2:
        return form.watch("timeframe") !== undefined;
      case 3:
        return true;
      case 4:
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

  const companySizeIcons: Record<string, IconName> = {
    solo: "user",
    "2-5": "users",
    "6-10": "building",
    "10+": "landmark",
  };

  const mainGoalIcons: Record<string, IconName> = {
    leads: "mail",
    sales: "dollar",
    awareness: "megaphone",
    recruitment: "user-plus",
    authority: "award",
  };

  const timeframeIcons: Record<string, IconName> = {
    "3m": "zap",
    "6m": "flame",
    "12m": "rocket",
  };

  const budgetIcons: Record<string, IconName> = {
    none: "circle-off",
    low: "wallet",
    medium: "banknote",
    high: "landmark",
  };

  const activityIcons: Record<string, IconName> = {
    linkedin: "linkedin",
    instagram: "instagram",
    facebook: "facebook",
    newsletter: "mail",
    blog: "pen-tool",
    podcast: "headphones",
    youtube: "youtube",
    ads: "target",
    events: "calendar-days",
    none: "circle-off",
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">
                    Hvilken bransje?
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="F.eks. IT-konsulent, coaching, bygg..."
                      className="h-14 text-lg"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="companySize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">
                    Bedriftsstørrelse
                  </FormLabel>
                  <FormControl>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {companySizeTypes.map((type) => (
                        <OptionCard
                          key={type}
                          value={type}
                          label={companySizeLabels[type]}
                          icon={companySizeIcons[type]}
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
          </div>
        );

      case 1:
        return (
          <FormField
            control={form.control}
            name="mainGoal"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="grid gap-3">
                    {marketingGoalTypes.map((type) => (
                      <OptionCard
                        key={type}
                        value={type}
                        label={marketingGoalLabels[type]}
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

      case 2:
        return (
          <FormField
            control={form.control}
            name="timeframe"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="grid gap-3">
                    {timeframeTypes.map((type) => (
                      <OptionCard
                        key={type}
                        value={type}
                        label={timeframeLabels[type]}
                        icon={timeframeIcons[type]}
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
            name="budget"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {budgetTypes.map((type) => (
                      <OptionCard
                        key={type}
                        value={type}
                        label={budgetLabels[type]}
                        icon={budgetIcons[type]}
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
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="existingActivities"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">
                    Hva gjør du allerede i dag?
                  </FormLabel>
                  <FormControl>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {existingActivityTypes.map((type) => {
                        const iconName = activityIcons[type];
                        const isChecked = field.value?.includes(type);
                        return (
                          <label
                            key={type}
                            htmlFor={`existing-activity-${type}`}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                              isChecked
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            <Checkbox
                              id={`existing-activity-${type}`}
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                const current = field.value || [];
                                if (checked) {
                                  field.onChange([...current, type]);
                                } else {
                                  field.onChange(
                                    current.filter((v) => v !== type)
                                  );
                                }
                              }}
                            />
                            {iconName && (
                              <Icon
                                name={iconName}
                                className={cn(
                                  "size-4",
                                  isChecked
                                    ? "text-primary"
                                    : "text-muted-foreground"
                                )}
                              />
                            )}
                            <span
                              className={cn(
                                "text-sm",
                                isChecked && "text-primary font-medium"
                              )}
                            >
                              {existingActivityLabels[type]}
                            </span>
                          </label>
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
              name="targetAudienceDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">
                    Beskriv målgruppen din
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="F.eks. Småbedriftseiere 30-50 år som..."
                      className="min-h-20 resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="competitors"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">
                    Hvem er konkurrentene dine?
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="F.eks. Bedrift A, Bedrift B..."
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

  const handleGenerate = () => {
    form.handleSubmit(onSubmit)();
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
              onClick={handleGenerate}
              disabled={isLoading}
              className="min-w-45"
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
                    <Icon name="loader" className="size-4 animate-spin" />
                  </motion.div>
                  Lager plan...
                </>
              ) : (
                "Lag markedsplan"
              )}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
