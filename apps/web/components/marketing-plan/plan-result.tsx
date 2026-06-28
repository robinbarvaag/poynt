"use client";

import { priorityConfig } from "@/lib/constants";
import type { MarketingPlanStream } from "@poynt/planner-validators";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Heading,
  Skeleton,
  Text,
} from "@poynt/ui";
import { Icon, type IconName } from "@poynt/ui/icons";
import type { DeepPartial } from "ai";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

interface PlanResultProps {
  // Under streaming er planen et delobjekt (felter fylles inn bit for bit), så
  // typen er DeepPartial. Et ferdig lagret resultat er også gyldig her.
  plan?: DeepPartial<MarketingPlanStream>;
  onReset?: () => void;
  /** Når true bygger planen seg fortsatt opp (streaming): vis status + skjelett. */
  isStreaming?: boolean;
  /** Legg quick wins i oppgavelista på nytt (for lagrede planer). */
  onSyncTasks?: () => void;
  /** Månedsnavn på utrullingsfaser som allerede er hentet inn som oppgaver. */
  pulledPhases?: Set<string>;
  /** Hent inn én utrullingsfase som oppgaver (progressivt). */
  onPullPhase?: (phase: { label: string; tasks: string[] }) => void;
}

// Hver seksjon animerer seg selv på egen mount (samme rolige, streaming-klare
// mønster som kanalveilederen) — ingen stagger-orkestrering, ingen spring-bounce.
const sectionMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: "easeOut" as const },
};

// Roterende «jobber»-meldinger mens vi venter på de første tokenene.
const STREAM_MESSAGES = [
  "Analyserer bedriften din …",
  "Velger de viktigste kanalene …",
  "Bygger tidslinjen måned for måned …",
  "Setter sammen ukesrutinen …",
];

/** Dempet detalj-blokk på et kanalkort (token-basert, ingen regnbuefarger). */
function DetailSection({
  icon,
  label,
  children,
}: {
  icon: IconName;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-3 space-y-1">
      <p className="flex items-center gap-1.5 font-medium text-muted-foreground text-xs uppercase tracking-wide">
        <Icon name={icon} className="size-3.5 text-primary" />
        {label}
      </p>
      {children}
    </div>
  );
}

/** Felles seksjonsoverskrift for strategi-siden. */
function SectionHeading({
  icon,
  title,
  subtitle,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon name={icon} className="size-5" />
      </div>
      <div>
        <h3 className="font-semibold text-lg leading-tight">{title}</h3>
        {subtitle && (
          <p className="text-muted-foreground text-sm">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

export function PlanResult({
  plan,
  onReset,
  isStreaming = false,
  onSyncTasks,
  pulledPhases,
  onPullPhase,
}: PlanResultProps) {
  // Roter «jobber»-meldingen mens vi streamer og før det første svaret kommer.
  const [messageTick, setMessageTick] = useState(0);
  useEffect(() => {
    if (!isStreaming) return;
    const id = setInterval(() => setMessageTick((t) => t + 1), 2200);
    return () => clearInterval(id);
  }, [isStreaming]);

  // Result mode — ingenting å vise enda, og vi streamer ikke → render ingenting.
  if (!plan && !isStreaming) {
    return null;
  }

  // Streaming-trygge avledninger: feltene fylles inn bit for bit, så vi vokter
  // på delvise/manglende verdier overalt.
  const channels = (plan?.channels ?? []).filter(
    (c): c is NonNullable<typeof c> => Boolean(c?.channel)
  );
  const timeline = (plan?.timeline ?? []).filter(
    (m): m is NonNullable<typeof m> => Boolean(m?.monthName)
  );
  const weeklyRoutine = (plan?.weeklyRoutine ?? []).filter(
    (t): t is NonNullable<typeof t> => Boolean(t?.task)
  );
  const quickWins = (plan?.quickWins ?? []).filter(
    (w): w is string => typeof w === "string" && w.length > 0
  );
  const tips = (plan?.tips ?? []).filter(
    (t): t is string => typeof t === "string" && t.length > 0
  );

  const streamingLabel = !plan?.summary
    ? STREAM_MESSAGES[messageTick % STREAM_MESSAGES.length]
    : channels.length === 0
      ? "Velger de viktigste kanalene …"
      : timeline.length === 0
        ? "Bygger tidslinjen måned for måned …"
        : "Fullfører planen …";

  return (
    <div className="space-y-10">
      {/* Header / status */}
      <motion.div
        {...sectionMotion}
        className="flex items-center justify-between gap-3"
      >
        <Heading size="h2">Din markedsplan</Heading>
        {isStreaming && (
          <span className="flex items-center gap-2 text-muted-foreground text-sm">
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
      </motion.div>

      {plan?.summary ? (
        <motion.div {...sectionMotion}>
          <Text>{plan.summary}</Text>
        </motion.div>
      ) : (
        isStreaming && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        )
      )}

      {/* Poynts vurdering — sekundært, dempet */}
      {plan?.reasoning && (
        <motion.div {...sectionMotion}>
          <div className="flex gap-3 rounded-lg border bg-card p-4">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Icon name="lightbulb" className="size-4" />
            </div>
            <div>
              <p className="mb-1 font-medium text-sm">
                Vår vurdering av situasjonen din
              </p>
              <p className="whitespace-pre-line text-muted-foreground text-sm leading-relaxed">
                {plan.reasoning}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Kanaler */}
      {channels.length > 0 && (
        <motion.section {...sectionMotion}>
          <SectionHeading
            icon="target"
            title="Kanaler å satse på"
            subtitle="Prioritert etter hva som gir mest for ressursene dine"
          />
          <div className="grid gap-4 md:grid-cols-2">
            {channels.map((channel, index) => {
              const config = channel.priority
                ? priorityConfig[channel.priority]
                : null;
              return (
                <Card
                  key={channel.channel ?? `channel-${index}`}
                  className="h-full"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-lg">
                        {channel.channel}
                      </CardTitle>
                      {config && (
                        <Badge variant={config.badge} size="sm">
                          {config.label}
                        </Badge>
                      )}
                    </div>
                    {channel.frequency && (
                      <p className="text-muted-foreground text-sm">
                        {channel.frequency}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {(channel.activities ?? [])
                        .filter((a): a is string => Boolean(a))
                        .map((activity) => (
                          <li
                            key={activity}
                            className="flex items-start gap-2 text-sm"
                          >
                            <Icon
                              name="arrow-right"
                              className="mt-0.5 size-4 shrink-0 text-primary"
                            />
                            <span>{activity}</span>
                          </li>
                        ))}
                    </ul>

                    {channel.expectedImpact && (
                      <DetailSection icon="zap" label="Forventet effekt">
                        <p className="text-muted-foreground text-sm">
                          {channel.expectedImpact}
                        </p>
                      </DetailSection>
                    )}

                    {channel.resourcesNeeded && (
                      <DetailSection icon="settings" label="Du trenger">
                        <p className="text-muted-foreground text-sm">
                          {channel.resourcesNeeded}
                        </p>
                      </DetailSection>
                    )}

                    {channel.successMetrics &&
                      channel.successMetrics.length > 0 && (
                        <DetailSection icon="bar-chart" label="Målepunkter">
                          <ul className="space-y-1">
                            {channel.successMetrics
                              .filter((m): m is string => Boolean(m))
                              .map((metric) => (
                                <li
                                  key={metric}
                                  className="flex items-start gap-1.5 text-muted-foreground text-xs"
                                >
                                  <span className="mt-0.5">•</span>
                                  <span>{metric}</span>
                                </li>
                              ))}
                          </ul>
                        </DetailSection>
                      )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Kanalveilederen er deep-dive-en for kanalvalget — lenk dit i stedet
              for å duplisere analysen her. */}
          {!isStreaming && (
            <Button
              asChild
              variant="link"
              size="sm"
              className="mt-3 h-auto gap-1.5 p-0 text-muted-foreground"
            >
              <Link href="/on-poynt/verktoy/kanalveileder">
                <Icon name="compass" className="size-4" />
                Gå dypere på kanalvalget med Kanalveilederen
              </Link>
            </Button>
          )}
        </motion.section>
      )}

      {/* Utrullingsplan (tidslinje, read-only roadmap) */}
      {timeline.length > 0 && (
        <motion.section {...sectionMotion}>
          <SectionHeading
            icon="calendar"
            title="Slik ruller du det ut"
            subtitle="Hent inn én fase om gangen når du er klar — så drukner du ikke i 12 måneder på en gang"
          />
          <ol className="space-y-3">
            {timeline.map((month, index) => {
              const tasks = (month.tasks ?? []).filter((t): t is string =>
                Boolean(t)
              );
              const label = month.monthName ?? "";
              const isPulled = Boolean(label && pulledPhases?.has(label));
              const canPull = Boolean(
                onPullPhase && !isStreaming && label && tasks.length > 0
              );
              return (
                <li
                  key={month.monthName ?? `month-${index}`}
                  className="flex gap-3 rounded-lg border bg-card p-4"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary text-sm">
                    {month.month ?? index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{month.monthName}</p>
                    {month.focus && (
                      <p className="text-muted-foreground text-sm">
                        {month.focus}
                      </p>
                    )}
                    {tasks.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {tasks.map((task) => (
                          <li
                            key={task}
                            className="flex items-start gap-2 text-sm"
                          >
                            <span className="mt-0.5 text-primary">•</span>
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {canPull &&
                      (isPulled ? (
                        <p className="mt-3 flex items-center gap-1.5 font-medium text-primary text-sm">
                          <Icon name="check-circle" className="size-4" />
                          Lagt i oppgavene
                        </p>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 gap-2"
                          onClick={() => onPullPhase?.({ label, tasks })}
                        >
                          <Icon name="plus" className="size-4" />
                          Legg fasen i oppgavene
                        </Button>
                      ))}
                  </div>
                </li>
              );
            })}
          </ol>
        </motion.section>
      )}

      {/* Ukentlig rutine (read-only referanse) */}
      {weeklyRoutine.length > 0 && (
        <motion.section {...sectionMotion}>
          <SectionHeading
            icon="clock"
            title="Ukentlig rutine"
            subtitle="En fast rytme du kan lene deg på"
          />
          <div className="space-y-2.5">
            {weeklyRoutine.map((task, index) => (
              <div
                key={`${task.day}-${task.task}-${index}`}
                className="flex items-center gap-4 rounded-lg border bg-card p-3"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 font-medium text-primary text-sm">
                  {(task.day ?? "").slice(0, 3)}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{task.task}</p>
                  {task.day && (
                    <p className="text-muted-foreground text-sm">{task.day}</p>
                  )}
                </div>
                {task.duration && (
                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <Icon name="clock" className="size-4" />
                    {task.duration}
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Oppgave-handoff → dashboardet */}
      {!isStreaming && quickWins.length > 0 && (
        <motion.section {...sectionMotion}>
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Icon name="zap" className="size-6 shrink-0 text-primary" />
                Kom i gang — oppgavene dine er klare
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                Vi har lagt disse quick wins-ene i oppgavelista di. Hak dem av
                på dashbordet etter hvert som du blir ferdig.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {quickWins.length > 0 && (
                <ul className="space-y-2">
                  {quickWins.slice(0, 5).map((win, idx) => (
                    <li key={win} className="flex items-start gap-2.5 text-sm">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary text-xs">
                        {idx + 1}
                      </span>
                      <span>{win}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                <Button asChild className="gap-2">
                  <Link href="/on-poynt/oversikt">
                    <Icon name="arrow-right" className="size-4" />
                    Se oppgavene på dashbordet
                  </Link>
                </Button>
                {onSyncTasks && (
                  <Button
                    variant="outline"
                    onClick={onSyncTasks}
                    className="gap-2"
                  >
                    <Icon name="refresh" className="size-4" />
                    Legg til i lista på nytt
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.section>
      )}

      {/* Tips for suksess */}
      {tips.length > 0 && (
        <motion.section {...sectionMotion}>
          <SectionHeading icon="lightbulb" title="Tips for suksess" />
          <ul className="grid gap-2 sm:grid-cols-2">
            {tips.map((tip) => (
              <li key={tip} className="flex items-start gap-2.5 text-sm">
                <Icon
                  name="check-circle"
                  className="mt-0.5 size-5 shrink-0 text-primary"
                />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </motion.section>
      )}

      {!isStreaming && onReset && (
        <motion.div {...sectionMotion} className="flex justify-center pt-2">
          <Button variant="outline" onClick={onReset} className="gap-2">
            <Icon name="refresh" className="size-4" />
            Lag ny plan
          </Button>
        </motion.div>
      )}
    </div>
  );
}
