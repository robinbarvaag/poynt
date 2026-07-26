"use client";

import {
  type BusinessIdentity,
  SCHEDULED_POST_TOOL_ID,
  type ScheduledPost,
  parseISODate,
} from "@/lib/planner/scheduled-posts";
import { trpc } from "@/lib/planner/trpc";
import type {
  GeneratePostRequest,
  YearlyPlanStream,
} from "@poynt/planner-validators";
import {
  Button,
  Card,
  CardContent,
  Heading,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
  Text,
  toast,
} from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import { cn } from "@poynt/ui/lib/utils";
import { duration, easeSoft, staggerStep } from "@poynt/ui/motion";
import type { DeepPartial } from "ai";
import type { DriveStep } from "driver.js";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TourButton } from "../planner/tour";
import { PlannerCalendar } from "./planner-calendar";
import { PostComposer } from "./post-composer";
import { SavedPostsDialog } from "./saved-posts-dialog";

export interface CalendarFeed {
  feedUrl: string;
  webcalUrl: string;
}

interface PlannerResultProps {
  // Under streaming er årshjulet et delobjekt; et ferdig lagret resultat er
  // også gyldig her.
  plan?: DeepPartial<YearlyPlanStream>;
  onReset?: () => void;
  /** Når true bygger årshjulet seg fortsatt opp (streaming): vis status. */
  isStreaming?: boolean;
  /** Signert .ics-feed for «abonner i kalender» (null før det finnes). */
  calendarFeed?: CalendarFeed | null;
  /** Bedriftsnavn + logo til forhåndsvisningen. */
  business: BusinessIdentity;
}

// Norske månedsnavn (jan→des) til hjulets 12 faste plasser, inkl. måneder som
// ikke er generert (vises disabled).
const MONTH_NAMES_NB = [
  "Januar",
  "Februar",
  "Mars",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Desember",
];

// Roterende «jobber»-meldinger mens vi venter på de første tokenene.
const STREAM_MESSAGES = [
  "Planlegger året ditt …",
  "Finner norske merkedager og sesonger …",
  "Fyller på innholdsideer måned for måned …",
  "Setter sammen årshjulet …",
];

const YEAR_TOUR_KEY = "on-poynt-tour-year-v1";

// Mikro-omvisning av de ikke-åpenbare delene av årshjulet.
const YEAR_TOUR_STEPS: DriveStep[] = [
  {
    element: '[data-tour="year-header"]',
    popover: {
      title: "Årshjulet ditt",
      description:
        "Hele året på ett sted — 12 måneder med innhold tilpasset bransjen og sesongene dine.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="year-view-toggle"]',
    popover: {
      title: "To måter å se det på",
      description:
        "«Kalender» er arbeidsflaten din. «Oversikt» zoomer ut til hjulet — der ser du hele året og hvor mange innlegg du har planlagt per måned.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="year-calendar"]',
    popover: {
      title: "Fra idé til ferdig innlegg",
      description:
        "Trykk en innholdsidé i kalenderen for å lage et ferdig innlegg — i bedriftens stemme, klart til å publisere.",
      side: "top",
      align: "start",
    },
  },
  {
    element: '[data-tour="year-sync"]',
    popover: {
      title: "Få planen i din egen kalender",
      description:
        "Abonner, så dukker årshjulet opp i Apple Kalender, Outlook eller Google — og oppdaterer seg selv.",
      side: "top",
      align: "start",
    },
  },
];

export function PlannerResult({
  plan,
  onReset,
  isStreaming = false,
  calendarFeed,
  business,
}: PlannerResultProps) {
  const reduce = useReducedMotion();
  // Standard = kalender (arbeidsflaten). «Oversikt» = hjulet (zoom ut).
  const [view, setView] = useState<"calendar" | "wheel">("calendar");
  // Lander på inneværende måned hvis den finnes i planen (et lagret årshjul har
  // alle månedene; et nytt starter uansett på inneværende måned). Ellers første.
  const [monthIndex, setMonthIndex] = useState(() => {
    const currentMonthNum = new Date().getMonth() + 1;
    const idx = (plan?.months ?? []).findIndex(
      (m) => m?.month === currentMonthNum
    );
    return idx >= 0 ? idx : 0;
  });
  const [messageTick, setMessageTick] = useState(0);
  // Planlagte/lagrede innlegg — løftet hit så både kalenderen og «Oversikt»-
  // heatmap-et deler samme kilde (hentes på nytt når refreshKey endrer seg).
  const [scheduled, setScheduled] = useState<ScheduledPost[]>([]);
  // Drill-down: hvilken post-idé vi lager et ferdig innlegg av (null = ingen).
  const [composingPost, setComposingPost] =
    useState<GeneratePostRequest | null>(null);
  const [composingDate, setComposingDate] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  // Bumpes når et innlegg lagres/slettes, så kalenderen henter på nytt.
  const [refreshKey, setRefreshKey] = useState(0);

  // Åpne drilldown for ett innlegg på en gitt dato. Memoisert: sendes som
  // onSaved/onComposePost ned i PostComposer, som har den i en effekt-dep —
  // ustabile referanser ville trigget re-generering i loop.
  const openComposer = useCallback(
    (post: GeneratePostRequest, isoDate: string) => {
      setComposingDate(isoDate);
      setComposingPost(post);
    },
    []
  );

  const closeComposer = useCallback(() => {
    setComposingPost(null);
    setComposingDate(null);
  }, []);

  const bumpRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);
  // Fra «Oversikt» (hjulet): hopp inn i kalenderen på den valgte måneden.
  const goToMonth = useCallback((index: number) => {
    setMonthIndex(index);
    setView("calendar");
  }, []);

  // Roter «jobber»-meldingen mens vi streamer.
  useEffect(() => {
    if (!isStreaming) return;
    const id = setInterval(() => setMessageTick((t) => t + 1), 2200);
    return () => clearInterval(id);
  }, [isStreaming]);

  // Hent planlagte innlegg (på nytt når et innlegg lagres/slettes).
  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshKey er en bevisst refetch-trigger
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const rows = await trpc.toolResult.list.query({
          toolId: SCHEDULED_POST_TOOL_ID,
          limit: 100,
        });
        if (active) setScheduled(rows as unknown as ScheduledPost[]);
      } catch {
        // stille
      }
    })();
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const months = (plan?.months ?? []).filter((m): m is NonNullable<typeof m> =>
    Boolean(m?.monthName)
  );

  // Antall planlagte innlegg per måned-nummer — til heatmap-et på hjulet.
  const countByMonth = useMemo(() => {
    const map = new Map<number, number>();
    for (const post of scheduled) {
      const p = parseISODate(post.result?.scheduledDate ?? null);
      if (!p) continue;
      map.set(p.month, (map.get(p.month) ?? 0) + 1);
    }
    return map;
  }, [scheduled]);

  if (!plan && !isStreaming) return null;

  const streamingLabel = STREAM_MESSAGES[messageTick % STREAM_MESSAGES.length];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-3" data-tour="year-header">
          <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon name="calendar-days" className="size-8" />
          </div>
          <Heading size="h2">
            Ditt årshjul{plan?.year ? ` ${plan.year}` : ""}
          </Heading>
          {plan?.summary ? (
            <Text>{plan.summary}</Text>
          ) : (
            isStreaming && (
              <div className="max-w-md space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            )
          )}
          {isStreaming && (
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon name="loader" className="size-4 animate-spin" />
              <AnimatePresence mode="wait">
                <motion.span
                  key={streamingLabel}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25 }}
                >
                  {streamingLabel}
                </motion.span>
              </AnimatePresence>
            </span>
          )}
        </div>
        {!isStreaming && months.length > 0 && (
          <TourButton
            tourKey={YEAR_TOUR_KEY}
            steps={YEAR_TOUR_STEPS}
            autoRun={!isStreaming}
          />
        )}
      </div>

      {/* View Toggle */}
      {months.length > 0 && (
        <div className="flex justify-start" data-tour="year-view-toggle">
          <Tabs
            value={view}
            onValueChange={(v) => setView(v as "calendar" | "wheel")}
          >
            <TabsList>
              <TabsTrigger value="calendar" className="gap-2">
                <Icon name="calendar" className="size-4" />
                Kalender
              </TabsTrigger>
              <TabsTrigger value="wheel" className="gap-2">
                <Icon name="calendar-days" className="size-4" />
                Oversikt
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Wheel View (oversikt) */}
      {months.length > 0 && view === "wheel" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative mx-auto aspect-square w-full max-w-3xl"
        >
          {/* Center */}
          <div className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 z-10 flex size-32 transform items-center justify-center rounded-full bg-primary/10">
            <div className="text-center">
              <span className="font-bold text-3xl text-primary">
                {plan?.year}
              </span>
              <p className="text-xs text-muted-foreground">Årshjul</p>
            </div>
          </div>

          {/* 12 faste plasser (jan→des). En generert måned legges på sin
              kalenderplass; passerte/ikke-genererte måneder vises disabled,
              men tar fortsatt plassen i ringen. */}
          {Array.from({ length: 12 }, (_, slot) => {
            const monthNumber = slot + 1;
            const angle = (slot * 30 - 90) * (Math.PI / 180);
            const radius = 42; // percentage from center
            const x = 50 + radius * Math.cos(angle);
            const y = 50 + radius * Math.sin(angle);

            const planIndex = months.findIndex((m) => m.month === monthNumber);
            const month = planIndex >= 0 ? months[planIndex] : null;
            const label = (month?.monthName || MONTH_NAMES_NB[slot]).slice(
              0,
              3
            );

            // Disabled plassholder for måneder vi ikke har planlagt.
            if (!month) {
              return (
                <motion.div
                  key={`slot-${monthNumber}`}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                  animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                  transition={{
                    duration: duration.fast,
                    ease: easeSoft,
                    delay: reduce ? 0 : (monthNumber - 1) * (staggerStep / 2),
                  }}
                  className="-translate-x-1/2 -translate-y-1/2 absolute transform cursor-default"
                  style={{ left: `${x}%`, top: `${y}%` }}
                  title="Ikke planlagt"
                >
                  <div className="flex size-20 flex-col items-center justify-center rounded-full border-2 border-border border-dashed bg-muted/30 text-muted-foreground/40 sm:size-24">
                    <span className="font-bold text-lg sm:text-xl">
                      {label}
                    </span>
                  </div>
                </motion.div>
              );
            }

            const count = countByMonth.get(monthNumber) ?? 0;
            const heat =
              count === 0
                ? "border-border bg-muted"
                : count <= 2
                  ? "border-primary/40 bg-primary/10"
                  : count <= 4
                    ? "border-primary/60 bg-primary/20"
                    : "border-primary bg-primary/30";

            return (
              <motion.div
                key={`slot-${monthNumber}`}
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                transition={{
                  duration: duration.fast,
                  ease: easeSoft,
                  delay: reduce ? 0 : (monthNumber - 1) * (staggerStep / 2),
                }}
                className="-translate-x-1/2 -translate-y-1/2 absolute transform cursor-pointer"
                style={{ left: `${x}%`, top: `${y}%` }}
                onClick={() => goToMonth(planIndex)}
              >
                <div
                  className={cn(
                    "relative flex size-20 flex-col items-center justify-center rounded-full border-2 text-foreground transition-[transform,border-color,box-shadow,background-color] duration-300 motion-safe:hover:scale-105 hover:border-primary hover:shadow-lg sm:size-24",
                    monthIndex === planIndex
                      ? "border-primary bg-primary/15 text-primary ring-2 ring-primary/30"
                      : heat
                  )}
                >
                  {count > 0 && (
                    <span className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-primary font-bold text-[10px] text-primary-foreground shadow ring-2 ring-background">
                      {count}
                    </span>
                  )}
                  <span className="font-bold text-lg sm:text-xl">{label}</span>
                  <span className="line-clamp-1 max-w-16 px-1 text-center text-muted-foreground text-xs">
                    {(month.theme ?? "").split(" ").slice(0, 2).join(" ")}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
      {months.length > 0 && view === "wheel" && (
        <p className="text-center text-muted-foreground text-xs">
          Tallet viser hvor mange innlegg du har planlagt den måneden. Trykk en
          måned for å åpne den i kalenderen. Grå, stiplede måneder er passert og
          ikke planlagt.
        </p>
      )}

      {/* Calendar View */}
      {months.length > 0 && view === "calendar" && (
        <div data-tour="year-calendar">
          <PlannerCalendar
            months={months}
            year={plan?.year}
            scheduled={scheduled}
            business={business}
            onComposePost={openComposer}
            onChanged={bumpRefresh}
            monthIndex={monthIndex}
            onMonthIndexChange={setMonthIndex}
          />
        </div>
      )}

      {/* Handlinger */}
      {months.length > 0 && (
        <div className="space-y-4 pt-2">
          {/* Synk til kalenderen din — forklart */}
          {!isStreaming && calendarFeed && (
            <Card className="bg-muted/40" data-tour="year-sync">
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon name="calendar-clock" className="size-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      Synk til kalenderen din
                    </p>
                    <p className="max-w-md text-muted-foreground text-sm">
                      Samme plan, to måter inn: <strong>Abonner</strong> åpner
                      Apple Kalender / Outlook direkte. For Google Kalender:{" "}
                      <strong>Kopier lenke</strong> og lim inn under «Legg til
                      kalender → Fra URL». Planen oppdaterer seg selv etterpå.
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    asChild
                    className="gap-2"
                    title="Åpner Apple Kalender / Outlook"
                  >
                    <a href={calendarFeed.webcalUrl}>
                      <Icon name="calendar-clock" className="size-4" />
                      Abonner
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2"
                    title="Kopier https-lenken (for Google Kalender)"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(
                          calendarFeed.feedUrl
                        );
                        toast("Abonnementslenken er kopiert");
                      } catch {
                        toast.error("Kunne ikke kopiere lenken");
                      }
                    }}
                  >
                    <Icon name="copy" className="size-4" />
                    Kopier lenke
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Primær-handlinger */}
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowSaved(true)}
              className="gap-2"
            >
              <Icon name="file-text" className="size-4" />
              Alle innlegg
            </Button>
            {!isStreaming && onReset && (
              <Button variant="ghost" onClick={onReset} className="gap-2">
                <Icon name="refresh" className="size-4" />
                Lag nytt årshjul
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Overlays: drill-down + lagrede innlegg (egne Dialog-er m/ scroll-lås) */}
      {composingPost && (
        <PostComposer
          post={composingPost}
          scheduledDate={composingDate}
          business={business}
          onClose={closeComposer}
          onSaved={bumpRefresh}
        />
      )}
      {showSaved && (
        <SavedPostsDialog
          onClose={() => setShowSaved(false)}
          onChanged={bumpRefresh}
        />
      )}
    </motion.div>
  );
}
