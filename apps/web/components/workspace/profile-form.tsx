"use client";

import { trpc } from "@/lib/planner/trpc";
import {
  type ProfileAudienceType,
  type ProfileCompanySize,
  mainGoalLabels,
  mainGoalTypes,
  profileAudienceTypeLabels,
  profileAudienceTypes,
  profileCompanySizeLabels,
  profileCompanySizes,
  strengthLabels,
  strengthTypes,
  weeklyTimeLabels,
  weeklyTimeTypes,
} from "@poynt/planner-validators";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@poynt/ui";
import { Input } from "@poynt/ui";
import { Textarea } from "@poynt/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@poynt/ui";
import { Skeleton } from "@poynt/ui";
import { toast } from "@poynt/ui";
import { useForm, zodResolver } from "@poynt/ui/form";
import { Icon } from "@poynt/ui/icons";
import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";

const profileFormSchema = z.object({
  industryId: z.string().nullable(),
  targetAudience: z.string().nullable(),
  audienceType: z.enum(profileAudienceTypes).nullable(),
  companySize: z.enum(profileCompanySizes).nullable(),
  goals: z.string().nullable(),
  mainGoal: z.enum(mainGoalTypes).nullable(),
  weeklyTime: z.enum(weeklyTimeTypes).nullable(),
  strengths: z.enum(strengthTypes).nullable(),
  customContext: z.string().nullable(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface Industry {
  id: string;
  name: string;
  icon: string | null;
}

interface WorkspaceProfileFormProps {
  disabled?: boolean;
  /** Hvilken bedrift profilen gjelder. Utelatt = aktiv bedrift. */
  workspaceId?: string;
}

export function WorkspaceProfileForm({
  disabled,
  workspaceId,
}: WorkspaceProfileFormProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const [industries, setIndustries] = useState<Industry[]>([]);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      industryId: null,
      targetAudience: null,
      audienceType: null,
      companySize: null,
      goals: null,
      mainGoal: null,
      weeklyTime: null,
      strengths: null,
      customContext: null,
    },
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [profile, industriesList] = await Promise.all([
          trpc.workspaceProfile.get.query(
            workspaceId ? { workspaceId } : undefined
          ),
          trpc.industry.list.query(),
        ]);

        const activeIndustries = industriesList.filter((i) => i.isActive);
        setIndustries(activeIndustries);

        if (profile) {
          form.reset({
            industryId: profile.industryId,
            targetAudience: profile.targetAudience,
            audienceType: profile.audienceType as ProfileAudienceType | null,
            companySize: profile.companySize as ProfileCompanySize | null,
            goals: profile.goals ? profile.goals.join(", ") : null,
            mainGoal: profile.mainGoal as ProfileFormValues["mainGoal"],
            weeklyTime: profile.weeklyTime as ProfileFormValues["weeklyTime"],
            strengths: profile.strengths as ProfileFormValues["strengths"],
            customContext: profile.customContext,
          });
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
        toast.error("Kunne ikke laste profil");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [form, workspaceId]);

  const saveProfile = useCallback(
    async (values: ProfileFormValues) => {
      setSaveStatus("saving");

      try {
        const goalsArray = values.goals
          ? values.goals
              .split(",")
              .map((g) => g.trim())
              .filter(Boolean)
          : null;

        await trpc.workspaceProfile.upsert.mutate({
          ...(workspaceId ? { workspaceId } : {}),
          industryId: values.industryId,
          targetAudience: values.targetAudience,
          audienceType: values.audienceType,
          companySize: values.companySize,
          goals: goalsArray,
          mainGoal: values.mainGoal,
          weeklyTime: values.weeklyTime,
          strengths: values.strengths,
          customContext: values.customContext,
        });

        setSaveStatus("saved");
        if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
        savedTimeoutRef.current = setTimeout(() => {
          setSaveStatus("idle");
        }, 2000);
      } catch (error) {
        console.error("Failed to save profile:", error);
        setSaveStatus("idle");
        toast.error("Kunne ikke lagre profil");
      }
    },
    [workspaceId]
  );

  useEffect(() => {
    const subscription = form.watch((values) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      saveTimeoutRef.current = setTimeout(() => {
        saveProfile(values as ProfileFormValues);
      }, 1000);
    });

    return () => {
      subscription.unsubscribe();
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
    };
  }, [form, saveProfile]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form className="space-y-6 relative">
        {/* Save status indicator */}
        <div className="absolute -top-8 right-0 flex items-center gap-2 text-sm text-muted-foreground">
          {saveStatus === "saving" && (
            <>
              <Icon name="loader" className="size-4 animate-spin" />
              <span>Lagrer...</span>
            </>
          )}
          {saveStatus === "saved" && (
            <>
              <Icon name="check" className="size-4 text-green-600" />
              <span className="text-green-600">Lagret</span>
            </>
          )}
        </div>

        <FormField
          control={form.control}
          name="industryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bransje</FormLabel>
              <Select
                disabled={disabled}
                value={field.value ?? ""}
                onValueChange={(value) => field.onChange(value || null)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg bransje" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {industries.map((industry) => (
                    <SelectItem key={industry.id} value={industry.id}>
                      {industry.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Brukes som standard i alle verktøy
              </FormDescription>
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
              <Select
                disabled={disabled}
                value={field.value ?? ""}
                onValueChange={(value) =>
                  field.onChange((value as ProfileCompanySize) || null)
                }
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg størrelse" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {profileCompanySizes.map((size) => (
                    <SelectItem key={size} value={size}>
                      {profileCompanySizeLabels[size]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="audienceType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Målgruppetype</FormLabel>
              <Select
                disabled={disabled}
                value={field.value ?? ""}
                onValueChange={(value) =>
                  field.onChange((value as ProfileAudienceType) || null)
                }
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="B2B, B2C eller begge?" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {profileAudienceTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {profileAudienceTypeLabels[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Selger du til bedrifter eller forbrukere?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mainGoal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hovedmål</FormLabel>
              <Select
                disabled={disabled}
                value={field.value ?? ""}
                onValueChange={(value) =>
                  field.onChange(
                    (value as ProfileFormValues["mainGoal"]) || null
                  )
                }
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Hva er viktigst akkurat nå?" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {mainGoalTypes.map((goal) => (
                    <SelectItem key={goal} value={goal}>
                      {mainGoalLabels[goal]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Verktøyene bruker dette som standardmål
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="weeklyTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tid til markedsføring per uke</FormLabel>
              <Select
                disabled={disabled}
                value={field.value ?? ""}
                onValueChange={(value) =>
                  field.onChange(
                    (value as ProfileFormValues["weeklyTime"]) || null
                  )
                }
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Hvor mye tid har du?" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {weeklyTimeTypes.map((time) => (
                    <SelectItem key={time} value={time}>
                      {weeklyTimeLabels[time]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Vi anbefaler kanaler som passer kapasiteten din
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="strengths"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Din styrke</FormLabel>
              <Select
                disabled={disabled}
                value={field.value ?? ""}
                onValueChange={(value) =>
                  field.onChange(
                    (value as ProfileFormValues["strengths"]) || null
                  )
                }
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Hva er du best på?" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {strengthTypes.map((strength) => (
                    <SelectItem key={strength} value={strength}>
                      {strengthLabels[strength]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Spill på styrkene dine – tekst, video, visuelt eller en miks
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="targetAudience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Målgruppe</FormLabel>
              <FormControl>
                <Textarea
                  disabled={disabled}
                  placeholder="Beskriv hvem kundene dine er..."
                  className="resize-none"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>
                Hvem er de typiske kundene dine? Alder, interesser, behov...
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="goals"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Markedsføringsmål</FormLabel>
              <FormControl>
                <Input
                  disabled={disabled}
                  placeholder="Flere kunder, økt synlighet, bygge merkevare..."
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>Skill med komma for flere mål</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customContext"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tilleggsinformasjon</FormLabel>
              <FormControl>
                <Textarea
                  disabled={disabled}
                  placeholder="Annen relevant info som AI-verktøyene bør vite om bedriften..."
                  className="resize-none"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>
                Ekstra kontekst som hjelper AI-verktøyene gi bedre svar
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
