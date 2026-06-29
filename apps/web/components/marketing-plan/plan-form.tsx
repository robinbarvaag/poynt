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
import {
  Badge,
  Button,
  Card,
  CardContent,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Heading,
  Input,
  OptionCard,
  Text,
  Textarea,
  cn,
} from "@poynt/ui";
import { useForm, zodResolver } from "@poynt/ui/form";
import { Icon, type IconName } from "@poynt/ui/icons";
import { motion } from "framer-motion";
import { useState } from "react";

type CompanySize = "solo" | "small" | "medium" | "large";

interface PlanFormProps {
  onSubmit: (data: MarketingPlanRequest) => Promise<void>;
  isLoading: boolean;
  initialIndustry?: string | null;
  initialCompanySize?: CompanySize | null;
  initialTargetAudience?: string | null;
}

const companySizeIcons: Record<string, IconName> = {
  solo: "user",
  small: "users",
  medium: "building",
  large: "landmark",
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

/** Liten seksjonsoverskrift inne i compose-skjemaet. */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="font-medium text-base">{children}</h3>;
}

export function PlanForm({
  onSubmit,
  isLoading,
  initialIndustry,
  initialCompanySize,
  initialTargetAudience,
}: PlanFormProps) {
  // «Profil-først»: bransje, størrelse og målgruppe kommer fra bedriftsprofilen
  // og vises som prefylte chips. Mangler noe (eller vil brukeren endre), faller
  // vi tilbake til input-feltene. Hovedmål og tidsramme er markedsplan-spesifikt
  // og spørres alltid — derfor én rolig skjerm i stedet for en 5-stegs wizard.
  const [editKnown, setEditKnown] = useState(
    !initialIndustry || !initialCompanySize
  );
  const [showMore, setShowMore] = useState(false);

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

  const industry = form.watch("industry");
  const companySize = form.watch("companySize");
  const targetAudience = form.watch("targetAudienceDescription");
  const mainGoal = form.watch("mainGoal");
  const timeframe = form.watch("timeframe");

  const canGenerate =
    Boolean(industry?.trim()) &&
    companySize !== undefined &&
    mainGoal !== undefined &&
    timeframe !== undefined;

  const handleGenerate = () => {
    form.handleSubmit(onSubmit)();
  };

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
        <div className="space-y-2">
          <Heading size="h2">Lag markedsplanen din</Heading>
          <Text customStyles="max-w-2xl">
            Vi bruker det vi vet om bedriften din. Velg målet og tidsrammen, så
            bygger vi en komplett strategi tilpasset deg.
          </Text>
        </div>

        {/* Dette vet vi om deg */}
        <Card size="sm" className="hover:shadow-sm">
          <CardContent className="space-y-3">
            <SectionTitle>Dette vet vi om deg</SectionTitle>

            {editKnown ? (
              <div className="space-y-5">
                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bransje</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="F.eks. IT-konsulent, coaching, bygg …"
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
                      <FormLabel>Bedriftsstørrelse</FormLabel>
                      <FormControl>
                        <div className="grid gap-2 sm:grid-cols-2">
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

                <FormField
                  control={form.control}
                  name="targetAudienceDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Målgruppe</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="F.eks. Småbedriftseiere 30-50 år som …"
                          className="min-h-20 resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {industry && (
                  <Badge variant="muted" size="md">
                    {industry}
                  </Badge>
                )}
                {companySize && (
                  <Badge variant="muted" size="md">
                    {companySizeLabels[companySize]}
                  </Badge>
                )}
                {targetAudience?.trim() && (
                  <Badge variant="muted" size="md">
                    {targetAudience}
                  </Badge>
                )}
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-muted-foreground"
                  onClick={() => setEditKnown(true)}
                >
                  Endre
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hovedmål */}
        <FormField
          control={form.control}
          name="mainGoal"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <SectionTitle>Hva er hovedmålet ditt?</SectionTitle>
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

        {/* Tidsramme */}
        <FormField
          control={form.control}
          name="timeframe"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <SectionTitle>Hvor lang plan ønsker du?</SectionTitle>
              <FormControl>
                <div className="grid gap-3 sm:grid-cols-3">
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

        {/* Flere detaljer (valgfritt) */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            className="flex w-full items-center justify-between rounded-lg border bg-muted/30 px-4 py-3 text-left transition-colors hover:bg-muted/50"
          >
            <span className="flex items-center gap-2.5">
              <Icon name="settings" className="size-4 text-muted-foreground" />
              <span className="font-medium text-sm">Flere detaljer</span>
              <Badge variant="muted" size="sm">
                valgfritt
              </Badge>
            </span>
            <Icon
              name="chevron-right"
              className={cn(
                "size-4 text-muted-foreground transition-transform",
                showMore && "rotate-90"
              )}
            />
          </button>

          {showMore && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="overflow-hidden"
            >
              <Card size="sm" className="hover:shadow-sm">
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hva er budsjettet?</FormLabel>
                        <FormControl>
                          <div className="grid gap-2 sm:grid-cols-2">
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

                  <FormField
                    control={form.control}
                    name="existingActivities"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hva gjør du allerede i dag?</FormLabel>
                        <FormControl>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {existingActivityTypes.map((type) => {
                              const isChecked =
                                field.value?.includes(type) ?? false;
                              return (
                                <OptionCard
                                  key={type}
                                  value={type}
                                  label={existingActivityLabels[type]}
                                  icon={activityIcons[type]}
                                  indicator="checkbox"
                                  isSelected={isChecked}
                                  onClick={() => {
                                    const current = field.value || [];
                                    field.onChange(
                                      current.includes(type)
                                        ? current.filter((v) => v !== type)
                                        : [...current, type]
                                    );
                                  }}
                                />
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
                    name="competitors"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hvem er konkurrentene dine?</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="F.eks. Bedrift A, Bedrift B …"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading || !canGenerate}
            className="min-w-45 gap-2"
          >
            {isLoading ? (
              <>
                <Icon name="loader" className="size-4 animate-spin" />
                Lager plan …
              </>
            ) : (
              <>
                <Icon name="bar-chart" className="size-4" />
                Lag markedsplan
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
