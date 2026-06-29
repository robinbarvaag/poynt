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
  OptionCard,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
  Textarea,
} from "@poynt/ui";
import { useForm, zodResolver } from "@poynt/ui/form";
import { Icon, type IconName } from "@poynt/ui/icons";
import { cn } from "@poynt/ui/lib/utils";
import { motion } from "framer-motion";
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

const channelIcons: Record<string, IconName> = {
  linkedin: "linkedin",
  instagram: "instagram",
  facebook: "facebook",
  tiktok: "music",
  youtube: "youtube",
  newsletter: "mail",
  blog: "pen-tool",
  podcast: "headphones",
};

const frequencyIcons: Record<string, IconName> = {
  daily: "rocket",
  "few-weekly": "flame",
  weekly: "zap",
  biweekly: "timer",
  monthly: "calendar-clock",
};

const audienceIcons: Record<string, IconName> = {
  b2b: "briefcase",
  b2c: "user-circle",
  both: "handshake",
};

const toneIcons: Record<string, IconName> = {
  professional: "award",
  casual: "heart",
  inspiring: "lightbulb",
  educational: "graduation-cap",
};

/** Liten seksjonsoverskrift inne i compose-skjemaet. */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="font-medium text-base">{children}</h3>;
}

export function PlannerForm({
  onSubmit,
  isLoading,
  industries,
  initialIndustry,
  initialAudience,
}: PlannerFormProps) {
  // «Profil-først»: bransje + målgruppe kommer fra bedriftsprofilen og vises som
  // prefylte chips. Mangler noe (eller vil brukeren endre), faller vi tilbake
  // til input-feltene. Resten (kanaler, frekvens, tone) er årshjul-spesifikt og
  // spørres alltid — derfor én rolig skjerm i stedet for en 5-stegs wizard.
  const [editKnown, setEditKnown] = useState(
    !initialIndustry || !initialAudience
  );
  const [showMore, setShowMore] = useState(false);

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

  const industry = form.watch("industry");
  const audience = form.watch("audience");
  const channels = form.watch("channels");
  const frequency = form.watch("frequency");

  const canGenerate =
    Boolean(industry?.trim()) &&
    audience !== undefined &&
    (channels?.length ?? 0) > 0 &&
    frequency !== undefined;

  const handleGenerate = () => {
    form.handleSubmit(onSubmit)();
  };

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
        <div className="space-y-2">
          <Heading size="h2">Lag årshjulet ditt</Heading>
          <Text customStyles="max-w-2xl">
            Vi bruker det vi vet om bedriften din. Velg kanalene og frekvensen,
            så setter vi sammen 12 måneder med innhold.
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
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Velg din bransje …" />
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

                <FormField
                  control={form.control}
                  name="audience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Målgruppe</FormLabel>
                      <FormControl>
                        <div className="grid gap-2 sm:grid-cols-3">
                          {audienceTypes.map((type) => (
                            <OptionCard
                              key={type}
                              value={type}
                              label={audienceLabels[type]}
                              icon={audienceIcons[type]}
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
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {industry && (
                  <Badge variant="muted" size="md">
                    {industry}
                  </Badge>
                )}
                {audience && (
                  <Badge variant="muted" size="md">
                    {audienceLabels[audience]}
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

        {/* Kanaler */}
        <FormField
          control={form.control}
          name="channels"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <SectionTitle>Hvilke kanaler vil du planlegge?</SectionTitle>
              <FormControl>
                <div className="grid gap-3 sm:grid-cols-2">
                  {publishChannelTypes.map((type) => {
                    const isChecked = field.value?.includes(type) ?? false;
                    return (
                      <OptionCard
                        key={type}
                        value={type}
                        label={publishChannelLabels[type]}
                        icon={channelIcons[type]}
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

        {/* Frekvens */}
        <FormField
          control={form.control}
          name="frequency"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <SectionTitle>Hvor ofte vil du publisere?</SectionTitle>
              <FormControl>
                <div className="grid gap-3 sm:grid-cols-2">
                  {frequencyTypes.map((type) => (
                    <OptionCard
                      key={type}
                      value={type}
                      label={frequencyLabels[type]}
                      icon={frequencyIcons[type]}
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
                    name="tone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hvilken tone vil du ha?</FormLabel>
                        <FormControl>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {contentToneTypes.map((type) => (
                              <OptionCard
                                key={type}
                                value={type}
                                label={contentToneLabels[type]}
                                icon={toneIcons[type]}
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
                    name="importantDates"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Viktige datoer for din bedrift</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="F.eks. Lansering i mars, jubileum i juni, messe i september …"
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
                        <FormLabel>Temaer du vil fokusere på</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="F.eks. Bærekraft, innovasjon, kundehistorier …"
                            className="min-h-20 resize-none"
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
                Genererer årsplan …
              </>
            ) : (
              <>
                <Icon name="calendar-days" className="size-4" />
                Lag årshjul
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
