"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { Progress } from "@poynt/ui";
import { Card, CardContent } from "@poynt/ui";
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
import { Icon, type IconName } from "@poynt/ui/icons";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useForm } from "react-hook-form";

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

  const progressValue = ((currentStep + 1) / TOTAL_STEPS) * 100;

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

  const renderOptionCard = (
    value: string,
    label: string,
    isSelected: boolean,
    onClick: () => void,
    iconName?: IconName
  ) => (
    <Card
      key={value}
      className={cn(
        "cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md",
        isSelected
          ? "ring-2 ring-primary bg-primary/5 border-primary"
          : "hover:border-primary/50"
      )}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
    >
      <CardContent className="flex items-center gap-3 p-4">
        {iconName && (
          <div
            className={cn(
              "size-10 rounded-lg flex items-center justify-center",
              isSelected
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            )}
          >
            <Icon name={iconName} className="size-5" />
          </div>
        )}
        <div
          className={cn(
            "size-5 rounded-full border-2 flex items-center justify-center transition-colors",
            isSelected
              ? "border-primary bg-primary"
              : "border-muted-foreground/30"
          )}
        >
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="size-2 rounded-full bg-white"
            />
          )}
        </div>
        <span className={cn("font-medium", isSelected && "text-primary")}>
          {label}
        </span>
      </CardContent>
    </Card>
  );

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
                      {companySizeTypes.map((type) =>
                        renderOptionCard(
                          type,
                          companySizeLabels[type],
                          field.value === type,
                          () => field.onChange(type),
                          companySizeIcons[type]
                        )
                      )}
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
                    {marketingGoalTypes.map((type) =>
                      renderOptionCard(
                        type,
                        marketingGoalLabels[type],
                        field.value === type,
                        () => field.onChange(type),
                        mainGoalIcons[type]
                      )
                    )}
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
                    {timeframeTypes.map((type) =>
                      renderOptionCard(
                        type,
                        timeframeLabels[type],
                        field.value === type,
                        () => field.onChange(type),
                        timeframeIcons[type]
                      )
                    )}
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
                    {budgetTypes.map((type) =>
                      renderOptionCard(
                        type,
                        budgetLabels[type],
                        field.value === type,
                        () => field.onChange(type),
                        budgetIcons[type]
                      )
                    )}
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
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                              isChecked
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            <Checkbox
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
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Steg {currentStep + 1} av {TOTAL_STEPS}
            </span>
            <span className="font-medium text-primary">
              {Math.round(progressValue)}% fullført
            </span>
          </div>
          <Progress value={progressValue} className="h-2" />
        </div>

        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center size-12 rounded-full bg-primary/10 text-primary mb-2">
            <Icon name={stepIconName} className="size-6" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {stepTitles[currentStep]}
          </h2>
          <p className="text-muted-foreground text-balance">
            {stepDescriptions[currentStep]}
          </p>
        </div>

        <div className="min-h-80">
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
        </div>

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
              className="min-w-45 bg-linear-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
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
                <>
                  <Icon name="sparkles" className="size-4 mr-2" />
                  Lag markedsplan
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
