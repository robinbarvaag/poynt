"use client";

import {
  type YearlyPlannerRequest,
  audienceLabels,
  audienceTypes,
  contentToneLabels,
  contentToneTypes,
  frequencyLabels,
  frequencyTypes,
  publishChannelLabels,
  publishChannelTypes,
  yearlyPlannerRequestSchema,
} from "@poynt/planner-validators";
import { Button } from "@poynt/ui";
import { Progress } from "@poynt/ui";
import { Card, CardContent } from "@poynt/ui";
import { Textarea } from "@poynt/ui";
import { Checkbox } from "@poynt/ui";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@poynt/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@poynt/ui";
import { useForm, zodResolver } from "@poynt/ui/form";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Briefcase,
  Building2,
  CalendarClock,
  CalendarDays,
  Clock,
  Facebook,
  Flame,
  GraduationCap,
  Handshake,
  Headphones,
  Heart,
  Instagram,
  Linkedin,
  type LucideIcon,
  Mail,
  Music,
  PenTool,
  Rocket,
  Share2,
  Sparkles,
  Timer,
  UserCircle,
  Users,
  Youtube,
  Zap,
} from "@poynt/ui/icons";
import { cn } from "@poynt/ui/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

type AudienceType = "b2b" | "b2c" | "both";

interface Industry {
  id: string;
  name: string;
  icon: string | null;
  isActive: boolean;
}

interface PlannerFormProps {
  onSubmit: (data: YearlyPlannerRequest) => Promise<void>;
  isLoading: boolean;
  industries: Industry[];
  initialIndustry?: string | null;
  initialAudience?: AudienceType | null;
}

const TOTAL_STEPS = 5;

const stepIcons: LucideIcon[] = [Building2, Share2, Clock, Users, CalendarDays];

const stepTitles = [
  "Hvilken bransje?",
  "Hvilke kanaler bruker du?",
  "Hvor ofte vil du publisere?",
  "Hvem er målgruppen?",
  "Ekstra detaljer (valgfritt)",
];

const stepDescriptions = [
  "Vi tilpasser innholdsforslag til din bransje og sesong.",
  "Velg kanalene du vil ha innholdsplan for.",
  "Vi tilpasser mengden innhold til din kapasitet.",
  "B2B eller B2C påvirker type innhold vi foreslår.",
  "Legg til viktige datoer og temaer for din bedrift.",
];

export function PlannerForm({
  onSubmit,
  isLoading,
  industries,
  initialIndustry,
  initialAudience,
}: PlannerFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const form = useForm<YearlyPlannerRequest>({
    resolver: zodResolver(yearlyPlannerRequestSchema),
    defaultValues: {
      industry: initialIndustry ?? "",
      channels: [],
      frequency: undefined,
      audience: initialAudience ?? undefined,
      tone: undefined,
      importantDates: "",
      focusTopics: "",
    },
    mode: "onChange",
  });

  const progressValue = ((currentStep + 1) / TOTAL_STEPS) * 100;

  const StepIcon = stepIcons[currentStep] ?? Building2;

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return form.watch("industry")?.trim().length > 0;
      case 1:
        return (form.watch("channels")?.length ?? 0) > 0;
      case 2:
        return form.watch("frequency") !== undefined;
      case 3:
        return form.watch("audience") !== undefined;
      case 4:
        return true; // Optional step
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
    Icon?: LucideIcon
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
        {Icon && (
          <div
            className={cn(
              "size-10 rounded-lg flex items-center justify-center",
              isSelected
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            )}
          >
            <Icon className="size-5" />
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

  const channelIcons: Record<string, LucideIcon> = {
    linkedin: Linkedin,
    instagram: Instagram,
    facebook: Facebook,
    tiktok: Music,
    youtube: Youtube,
    newsletter: Mail,
    blog: PenTool,
    podcast: Headphones,
  };

  const frequencyIcons: Record<string, LucideIcon> = {
    daily: Rocket,
    "few-weekly": Flame,
    weekly: Zap,
    biweekly: Timer,
    monthly: CalendarClock,
  };

  const audienceIcons: Record<string, LucideIcon> = {
    b2b: Briefcase,
    b2c: UserCircle,
    both: Handshake,
  };

  const toneIcons: Record<string, LucideIcon> = {
    professional: Award,
    casual: Heart,
    inspiring: Sparkles,
    educational: GraduationCap,
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <FormField
            control={form.control}
            name="industry"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Velg din bransje..." />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((ind) => (
                        <SelectItem key={ind.id} value={ind.name}>
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
            name="channels"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {publishChannelTypes.map((type) => {
                      const Icon = channelIcons[type];
                      const isChecked = field.value?.includes(type);
                      return (
                        <label
                          key={type}
                          htmlFor={`channel-${type}`}
                          className={cn(
                            "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all",
                            isChecked
                              ? "border-primary bg-primary/5 ring-2 ring-primary"
                              : "border-border hover:border-primary/50"
                          )}
                        >
                          <Checkbox
                            id={`channel-${type}`}
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
                          {Icon && (
                            <Icon
                              className={cn(
                                "size-5",
                                isChecked
                                  ? "text-primary"
                                  : "text-muted-foreground"
                              )}
                            />
                          )}
                          <span
                            className={cn(
                              "font-medium",
                              isChecked && "text-primary"
                            )}
                          >
                            {publishChannelLabels[type]}
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
        );

      case 2:
        return (
          <FormField
            control={form.control}
            name="frequency"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="grid gap-3">
                    {frequencyTypes.map((type) =>
                      renderOptionCard(
                        type,
                        frequencyLabels[type],
                        field.value === type,
                        () => field.onChange(type),
                        frequencyIcons[type]
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
            name="audience"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="grid gap-3">
                    {audienceTypes.map((type) =>
                      renderOptionCard(
                        type,
                        audienceLabels[type],
                        field.value === type,
                        () => field.onChange(type),
                        audienceIcons[type]
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
              name="tone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">
                    Hvilken tone vil du ha?
                  </FormLabel>
                  <FormControl>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {contentToneTypes.map((type) => {
                        const Icon = toneIcons[type];
                        const isSelected = field.value === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            aria-pressed={isSelected}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all text-left",
                              isSelected
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            )}
                            onClick={() => field.onChange(type)}
                          >
                            {Icon && (
                              <Icon
                                className={cn(
                                  "size-4",
                                  isSelected
                                    ? "text-primary"
                                    : "text-muted-foreground"
                                )}
                              />
                            )}
                            <span
                              className={cn(
                                "text-sm",
                                isSelected && "text-primary font-medium"
                              )}
                            >
                              {contentToneLabels[type]}
                            </span>
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
              name="importantDates"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">
                    Viktige datoer for din bedrift
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="F.eks. Lansering i mars, jubileum i juni, messe i september..."
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
              name="focusTopics"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">
                    Temaer du vil fokusere på
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="F.eks. Bærekraft, innovasjon, kundehistorier..."
                      className="min-h-20 resize-none"
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
        {/* Progress Section */}
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

        {/* Step Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center size-12 rounded-full bg-primary/10 text-primary mb-2">
            <StepIcon className="size-6" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {stepTitles[currentStep]}
          </h2>
          <p className="text-muted-foreground text-balance">
            {stepDescriptions[currentStep]}
          </p>
        </div>

        {/* Step Content */}
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

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={goBack}
            disabled={currentStep === 0}
            className={cn(currentStep === 0 && "invisible")}
          >
            <ArrowLeft className="size-4 mr-2" />
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
              <ArrowRight className="size-4 ml-2" />
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
                    <Sparkles className="size-4 mr-2" />
                  </motion.div>
                  Genererer årsplan...
                </>
              ) : (
                <>
                  <Sparkles className="size-4 mr-2" />
                  Lag årshjul
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
