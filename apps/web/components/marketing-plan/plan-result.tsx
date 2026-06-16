"use client";

import { priorityConfig } from "@/lib/constants";
import { trpc } from "@/lib/planner/trpc";
import type { MarketingPlan } from "@poynt/planner-validators";
import { Card, CardContent, CardHeader, CardTitle } from "@poynt/ui";
import { Button } from "@poynt/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@poynt/ui";
import { Checkbox } from "@poynt/ui";
import { cn } from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface PlanProgressItem {
  type?: string;
  // Lagres som tekst i databasen (PlannerMarketingPlanProgress); leses kun i
  // template-literals, så vi godtar både streng, tall og null.
  monthIndex?: string | number | null;
  taskIndex?: string | number | null;
}

interface PlanResultProps {
  plan?: MarketingPlan;
  onReset?: () => void;
  mode?: "intro" | "result";
  onStartForm?: () => void;
  toolResultId?: string;
  initialProgress?: PlanProgressItem[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    },
  },
};

export function PlanResult({
  plan,
  onReset,
  mode = "result",
  onStartForm,
  toolResultId,
  initialProgress = [],
}: PlanResultProps) {
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  // Update completed tasks from initialProgress
  useEffect(() => {
    if (initialProgress.length > 0) {
      const completed = new Set<string>();
      for (const progress of initialProgress) {
        if (progress.type === "timeline") {
          completed.add(
            `timeline-${progress.monthIndex}-${progress.taskIndex}`
          );
        } else {
          completed.add(`quickwin-${progress.taskIndex}`);
        }
      }
      setCompletedTasks(completed);
    }
  }, [initialProgress]);

  const handleTimelineTaskToggle = async (
    monthIndex: number,
    taskIndex: number
  ) => {
    if (!toolResultId) return;

    const key = `timeline-${monthIndex}-${taskIndex}`;
    const newCompleted = new Set(completedTasks);

    if (completedTasks.has(key)) {
      newCompleted.delete(key);
    } else {
      newCompleted.add(key);
    }

    setCompletedTasks(newCompleted);

    try {
      await trpc.marketingPlanProgress.toggleTimelineTask.mutate({
        toolResultId,
        monthIndex,
        taskIndex,
      });
    } catch (error) {
      console.error("Failed to toggle task:", error);
      // Revert on error
      setCompletedTasks(completedTasks);
    }
  };

  const handleQuickWinToggle = async (taskIndex: number) => {
    if (!toolResultId) return;

    const key = `quickwin-${taskIndex}`;
    const newCompleted = new Set(completedTasks);

    if (completedTasks.has(key)) {
      newCompleted.delete(key);
    } else {
      newCompleted.add(key);
    }

    setCompletedTasks(newCompleted);

    try {
      await trpc.marketingPlanProgress.toggleQuickWin.mutate({
        toolResultId,
        taskIndex,
      });
    } catch (error) {
      console.error("Failed to toggle quick win:", error);
      // Revert on error
      setCompletedTasks(completedTasks);
    }
  };

  const isTimelineTaskCompleted = (monthIndex: number, taskIndex: number) => {
    return completedTasks.has(`timeline-${monthIndex}-${taskIndex}`);
  };

  const isQuickWinCompleted = (taskIndex: number) => {
    return completedTasks.has(`quickwin-${taskIndex}`);
  };

  const getMonthProgress = (monthIndex: number, totalTasks: number) => {
    let completed = 0;
    for (let i = 0; i < totalTasks; i++) {
      if (isTimelineTaskCompleted(monthIndex, i)) {
        completed++;
      }
    }
    return {
      completed,
      total: totalTasks,
      percentage: (completed / totalTasks) * 100,
    };
  };

  // Intro mode
  if (mode === "intro") {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-10 max-w-5xl mx-auto"
      >
        <motion.div variants={itemVariants} className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="inline-flex items-center justify-center size-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary mb-2"
          >
            <Icon name="calendar" className="size-10" />
          </motion.div>
          <h1 className="text-4xl font-bold tracking-tight">
            Lag din skreddersydde markedsplan
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Slutt å gjette hva du skal gjøre. Få en komplett markedsplan
            tilpasset din bransje, mål og ressurser - med konkrete aktiviteter
            for hver uke.
          </p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Icon name="compass" className="size-5 text-primary" />
                Dette får du
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                      <Icon name="target" className="size-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">
                        Prioriterte kanaler
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Hvilke kanaler du bør satse på, hvor ofte, og konkret
                        hva du skal gjøre
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="size-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                      <Icon
                        name="calendar"
                        className="size-5 text-purple-600"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Månedlig tidslinje</h3>
                      <p className="text-sm text-muted-foreground">
                        Måned-for-måned med fokusområder og konkrete oppgaver
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="size-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                      <Icon name="clock" className="size-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Ukentlig rutine</h3>
                      <p className="text-sm text-muted-foreground">
                        Forslag til fast ukesplan med tidsestimat
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="size-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Icon name="zap" className="size-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Quick wins</h3>
                      <p className="text-sm text-muted-foreground">
                        4-6 ting du kan gjøre denne uken som gir rask effekt
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="text-center pt-4">
          <Button
            size="lg"
            onClick={onStartForm}
            className="gap-2 px-8 h-12 text-base"
          >
            <Icon name="sparkles" className="size-5" />
            Lag min markedsplan
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Ca. 3 minutter • Helt gratis
          </p>
        </motion.div>
      </motion.div>
    );
  }

  // Result mode
  if (!plan) {
    return null;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="text-center space-y-3">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 0.2,
          }}
          className="inline-flex items-center justify-center size-16 rounded-full bg-linear-to-br from-primary/20 to-primary/10 text-primary mb-2"
        >
          <Icon name="sparkles" className="size-8" />
        </motion.div>
        <h2 className="text-3xl font-bold tracking-tight">Din markedsplan</h2>
        <p className="text-muted-foreground text-lg mx-auto">{plan.summary}</p>
      </motion.div>

      {plan.reasoning && (
        <motion.div variants={itemVariants}>
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Icon name="lightbulb" className="size-5 text-primary" />
                Vår vurdering av din situasjon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/90 leading-relaxed whitespace-pre-line">
                {plan.reasoning}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <Tabs defaultValue="channels" className="w-full">
          <TabsList className="w-full grid grid-cols-4 h-auto">
            <TabsTrigger value="channels" className="flex flex-col gap-1 py-3">
              <div className="flex items-center gap-1.5">
                <Icon name="target" className="size-3.5" />
                <span className="font-medium">Kanaler</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-normal leading-tight">
                Prioritering
              </span>
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex flex-col gap-1 py-3">
              <div className="flex items-center gap-1.5">
                <Icon name="calendar" className="size-3.5" />
                <span className="font-medium">Tidslinje</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-normal leading-tight">
                Måned-for-måned
              </span>
            </TabsTrigger>
            <TabsTrigger value="weekly" className="flex flex-col gap-1 py-3">
              <div className="flex items-center gap-1.5">
                <Icon name="clock" className="size-3.5" />
                <span className="font-medium">Ukentlig rutine</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-normal leading-tight">
                Rutineforslag
              </span>
            </TabsTrigger>
            <TabsTrigger value="quickwins" className="flex flex-col gap-1 py-3">
              <div className="flex items-center gap-1.5">
                <Icon name="zap" className="size-3.5" />
                <span className="font-medium">Quick wins</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-normal leading-tight">
                Raske resultater
              </span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="channels" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plan.channels.map((channel, index) => {
                const config = priorityConfig[channel.priority];
                return (
                  <motion.div
                    key={channel.channel}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card
                      className={cn(
                        "h-full transition-all duration-300 hover:shadow-md",
                        config.border
                      )}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            {channel.channel}
                          </CardTitle>
                          <span
                            className={cn(
                              "text-xs px-2 py-1 rounded-full font-medium",
                              config.bg,
                              config.color
                            )}
                          >
                            {config.label}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {channel.frequency}
                        </p>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {channel.activities.map((activity) => (
                            <li
                              key={activity}
                              className="flex items-start gap-2 text-sm"
                            >
                              <Icon
                                name="arrow-right"
                                className="size-4 text-primary mt-0.5 shrink-0"
                              />
                              <span>{activity}</span>
                            </li>
                          ))}
                        </ul>

                        {channel.expectedImpact && (
                          <div className="mt-4 pt-4 border-t space-y-1">
                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                              <Icon name="zap" className="size-3.5" />
                              Forventet effekt
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {channel.expectedImpact}
                            </p>
                          </div>
                        )}

                        {channel.resourcesNeeded && (
                          <div className="mt-3 space-y-1">
                            <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                              <Icon name="settings" className="size-3.5" />
                              Du trenger
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {channel.resourcesNeeded}
                            </p>
                          </div>
                        )}

                        {channel.potentialChallenges &&
                          channel.potentialChallenges.length > 0 && (
                            <div className="mt-3 space-y-1">
                              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                <Icon
                                  name="alert-triangle"
                                  className="size-3.5"
                                />
                                Utfordringer
                              </p>
                              <ul className="space-y-1">
                                {channel.potentialChallenges.map(
                                  (challenge) => (
                                    <li
                                      key={challenge}
                                      className="text-xs text-muted-foreground flex items-start gap-1.5"
                                    >
                                      <span className="text-amber-600 dark:text-amber-400 mt-0.5">
                                        •
                                      </span>
                                      <span>{challenge}</span>
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}

                        {channel.successMetrics &&
                          channel.successMetrics.length > 0 && (
                            <div className="mt-3 space-y-1">
                              <p className="text-xs font-semibold text-green-600 dark:text-green-400 flex items-center gap-1.5">
                                <Icon name="bar-chart" className="size-3.5" />
                                Målepunkter
                              </p>
                              <ul className="space-y-1">
                                {channel.successMetrics.map((metric) => (
                                  <li
                                    key={metric}
                                    className="text-xs text-muted-foreground flex items-start gap-1.5"
                                  >
                                    <span className="text-green-600 dark:text-green-400 mt-0.5">
                                      •
                                    </span>
                                    <span>{metric}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="mt-6">
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border hidden sm:block" />

              <div className="space-y-6">
                {plan.timeline.map((month, index) => (
                  <motion.div
                    key={month.month}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative"
                  >
                    <div className="absolute left-2 top-4 size-5 rounded-full bg-primary border-4 border-background hidden sm:block" />

                    <Card className="sm:ml-12">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 text-primary font-bold">
                            {month.month}
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg">
                              {month.monthName}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {month.focus}
                            </p>
                          </div>
                          {(() => {
                            const progress = getMonthProgress(
                              index,
                              month.tasks.length
                            );
                            return progress.completed === progress.total &&
                              progress.total > 0 ? (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="flex items-center gap-2 text-sm font-semibold text-green-600 dark:text-green-400"
                              >
                                <Icon name="check-circle" className="size-5" />
                                Fullført
                              </motion.div>
                            ) : null;
                          })()}
                        </div>
                        {(() => {
                          const progress = getMonthProgress(
                            index,
                            month.tasks.length
                          );
                          return progress.total > 0 ? (
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                <span>Fremgang</span>
                                <span>
                                  {progress.completed} / {progress.total}
                                </span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progress.percentage}%` }}
                                  transition={{
                                    duration: 0.5,
                                    ease: "easeOut",
                                  }}
                                  className="h-full bg-primary"
                                />
                              </div>
                            </div>
                          ) : null;
                        })()}
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {month.tasks.map((task, i) => {
                            const taskCompleted = isTimelineTaskCompleted(
                              index,
                              i
                            );
                            return (
                              <li
                                key={`${month.month}-${task}`}
                                className="flex items-start gap-3"
                              >
                                <Checkbox
                                  id={`task-${month.month}-${i}`}
                                  checked={taskCompleted}
                                  onCheckedChange={() =>
                                    handleTimelineTaskToggle(index, i)
                                  }
                                />
                                <label
                                  htmlFor={`task-${month.month}-${i}`}
                                  className={cn(
                                    "text-sm leading-tight cursor-pointer",
                                    taskCompleted &&
                                      "line-through text-muted-foreground"
                                  )}
                                >
                                  {task}
                                </label>
                              </li>
                            );
                          })}
                        </ul>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="weekly" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="clock" className="size-5" />
                  Din ukentlige rutine
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {plan.weeklyRoutine.map((task, index) => (
                    <motion.div
                      key={`${task.day}-${task.task}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 text-primary font-medium text-sm">
                        {task.day.slice(0, 3)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{task.task}</p>
                        <p className="text-sm text-muted-foreground">
                          {task.day}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Icon name="clock" className="size-4" />
                        {task.duration}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quickwins" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="zap" className="size-5 text-yellow-500" />
                    Gjør dette først
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.quickWins.map((win, index) => {
                      const winCompleted = isQuickWinCompleted(index);
                      return (
                        <motion.li
                          key={win}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-start gap-3"
                        >
                          <Checkbox
                            id={`quickwin-${index}`}
                            checked={winCompleted}
                            onCheckedChange={() => handleQuickWinToggle(index)}
                            className="mt-1"
                          />
                          <label
                            htmlFor={`quickwin-${index}`}
                            className={cn(
                              "text-sm cursor-pointer flex-1",
                              winCompleted &&
                                "line-through text-muted-foreground"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <div className="flex items-center justify-center size-6 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-bold shrink-0">
                                {index + 1}
                              </div>
                              <span>{win}</span>
                            </div>
                          </label>
                        </motion.li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="lightbulb" className="size-5 text-blue-500" />
                    Tips for suksess
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.tips.map((tip, index) => (
                      <motion.li
                        key={tip}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-start gap-3"
                      >
                        <Icon
                          name="check-circle"
                          className="size-5 text-blue-500 shrink-0 mt-0.5"
                        />
                        <span className="text-sm">{tip}</span>
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden relative border-[oklch(0.78_0.07_175)] dark:border-[oklch(0.40_0.10_175)]">
          <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.88_0.04_175)] via-[oklch(0.85_0.05_175)] to-[oklch(0.82_0.06_175)] dark:from-[oklch(0.45_0.09_175)] dark:via-[oklch(0.40_0.10_175)] dark:to-[oklch(0.35_0.11_175)]" />
          <CardHeader className="relative">
            <CardTitle className="text-xl sm:text-2xl flex items-center gap-2 text-[oklch(0.25_0.05_175)] dark:text-[oklch(0.95_0.02_175)]">
              <Icon name="zap" className="size-6 shrink-0" />
              DITT NESTE STEG
            </CardTitle>
            <p className="text-sm text-[oklch(0.35_0.04_175)] dark:text-[oklch(0.85_0.03_175)]">
              Nå som du har planen, er det på tide å komme i gang. Start med ett
              av quick wins for å få fart på sakene.
            </p>
          </CardHeader>
          <CardContent className="relative">
            <div className="grid sm:grid-cols-2 gap-4">
              {plan.quickWins.slice(0, 4).map((win, idx) => (
                <div
                  key={win}
                  className="flex gap-3 p-4 rounded-lg bg-white/60 dark:bg-[oklch(0.25_0.05_175)]/40 backdrop-blur-sm border border-[oklch(0.75_0.05_175)]/30 dark:border-[oklch(0.45_0.08_175)]/30"
                >
                  <div className="flex items-center justify-center size-8 rounded-lg bg-[oklch(0.75_0.07_175)] dark:bg-[oklch(0.45_0.10_175)] text-[oklch(0.25_0.05_175)] dark:text-[oklch(0.95_0.02_175)] font-bold text-sm shrink-0">
                    {idx + 1}
                  </div>
                  <p className="text-sm text-[oklch(0.30_0.04_175)] dark:text-[oklch(0.90_0.02_175)] font-medium">
                    {win}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants} className="flex justify-center pt-4">
        <Button variant="outline" onClick={onReset} className="gap-2">
          <Icon name="refresh" className="size-4" />
          Lag ny plan
        </Button>
      </motion.div>
    </motion.div>
  );
}
