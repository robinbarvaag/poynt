"use client";

import type { MonthContent, YearlyPlan } from "@poynt/planner-validators";
import { Card, CardContent, CardHeader, CardTitle } from "@poynt/ui";
import { Button } from "@poynt/ui";
import { Tabs, TabsList, TabsTrigger } from "@poynt/ui";
import {
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  type LucideIcon,
  RefreshCcw,
  Sparkles,
} from "@poynt/ui/icons";
import { cn } from "@poynt/ui/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

interface PlannerResultProps {
  plan: YearlyPlan;
  onReset: () => void;
}

const monthColors = [
  "from-blue-500/20 to-blue-600/20 border-blue-500/30",
  "from-indigo-500/20 to-indigo-600/20 border-indigo-500/30",
  "from-violet-500/20 to-violet-600/20 border-violet-500/30",
  "from-purple-500/20 to-purple-600/20 border-purple-500/30",
  "from-pink-500/20 to-pink-600/20 border-pink-500/30",
  "from-rose-500/20 to-rose-600/20 border-rose-500/30",
  "from-orange-500/20 to-orange-600/20 border-orange-500/30",
  "from-amber-500/20 to-amber-600/20 border-amber-500/30",
  "from-yellow-500/20 to-yellow-600/20 border-yellow-500/30",
  "from-lime-500/20 to-lime-600/20 border-lime-500/30",
  "from-green-500/20 to-green-600/20 border-green-500/30",
  "from-teal-500/20 to-teal-600/20 border-teal-500/30",
];

const monthTextColors = [
  "text-blue-600 dark:text-blue-400",
  "text-indigo-600 dark:text-indigo-400",
  "text-violet-600 dark:text-violet-400",
  "text-purple-600 dark:text-purple-400",
  "text-pink-600 dark:text-pink-400",
  "text-rose-600 dark:text-rose-400",
  "text-orange-600 dark:text-orange-400",
  "text-amber-600 dark:text-amber-400",
  "text-yellow-600 dark:text-yellow-400",
  "text-lime-600 dark:text-lime-400",
  "text-green-600 dark:text-green-400",
  "text-teal-600 dark:text-teal-400",
];

export function PlannerResult({ plan, onReset }: PlannerResultProps) {
  const [selectedMonth, setSelectedMonth] = useState<MonthContent | null>(null);
  const [view, setView] = useState<"wheel" | "list">("wheel");

  const handleMonthClick = (month: MonthContent) => {
    setSelectedMonth(month);
  };

  const handleCloseMonth = () => {
    setSelectedMonth(null);
  };

  const navigateMonth = (direction: "prev" | "next") => {
    if (!selectedMonth) return;
    const currentIndex = plan.months.findIndex(
      (m) => m.month === selectedMonth.month
    );
    const newIndex =
      direction === "prev"
        ? (currentIndex - 1 + 12) % 12
        : (currentIndex + 1) % 12;
    const newMonth = plan.months[newIndex];
    if (newMonth) {
      setSelectedMonth(newMonth);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="text-center space-y-3">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="inline-flex items-center justify-center size-16 rounded-full bg-linear-to-br from-primary/20 to-primary/10 text-primary mb-2"
        >
          <CalendarDays className="size-8" />
        </motion.div>
        <h2 className="text-3xl font-bold tracking-tight">
          Ditt årshjul {plan.year}
        </h2>
        <p className="text-muted-foreground text-lg mx-auto">{plan.summary}</p>
      </div>

      {/* View Toggle */}
      <div className="flex justify-center">
        <Tabs
          value={view}
          onValueChange={(v) => setView(v as "wheel" | "list")}
        >
          <TabsList>
            <TabsTrigger value="wheel" className="gap-2">
              <Sparkles className="size-4" />
              Årshjul
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <Calendar className="size-4" />
              Listevisning
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <AnimatePresence mode="wait">
        {/* Month Detail Modal */}
        {selectedMonth && (
          <motion.div
            key="month-detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            onClick={handleCloseMonth}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <Card
                className={cn(
                  "bg-linear-to-br border",
                  monthColors[(selectedMonth.month - 1) % 12]
                )}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigateMonth("prev")}
                    >
                      <ChevronLeft className="size-5" />
                    </Button>
                    <div className="text-center">
                      <CardTitle className="text-2xl">
                        {selectedMonth.monthName}
                      </CardTitle>
                      <p
                        className={cn(
                          "text-sm font-medium",
                          monthTextColors[(selectedMonth.month - 1) % 12]
                        )}
                      >
                        {selectedMonth.theme}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigateMonth("next")}
                    >
                      <ChevronRight className="size-5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Posts */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <CalendarDays className="size-4" />
                      Innholdsforslag
                    </h4>
                    <div className="space-y-2">
                      {selectedMonth.posts.map((post) => (
                        <div
                          key={`${post.week}-${post.idea}`}
                          className="flex items-start gap-3 p-3 rounded-lg bg-background/50"
                        >
                          <div className="flex items-center justify-center size-8 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                            U{post.week}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted">
                                {post.channel}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {post.type}
                              </span>
                            </div>
                            <p className="text-sm">{post.idea}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Key Dates */}
                  {selectedMonth.keyDates.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Sparkles className="size-4" />
                        Viktige datoer
                      </h4>
                      <div className="space-y-2">
                        {selectedMonth.keyDates.map((date) => (
                          <div
                            key={`${date.date}-${date.event}`}
                            className="p-3 rounded-lg bg-background/50"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-primary">
                                {date.date}
                              </span>
                              <span className="text-sm font-medium">
                                {date.event}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              💡 {date.contentIdea}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tips */}
                  {selectedMonth.tips.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Lightbulb className="size-4" />
                        Tips for måneden
                      </h4>
                      <ul className="space-y-1">
                        {selectedMonth.tips.map((tip) => (
                          <li
                            key={tip}
                            className="text-sm flex items-start gap-2"
                          >
                            <span className="text-primary">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleCloseMonth}
                  >
                    Lukk
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wheel View */}
      {view === "wheel" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full max-w-3xl mx-auto aspect-square"
        >
          {/* Center */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 size-32 rounded-full bg-primary/10 flex items-center justify-center z-10">
            <div className="text-center">
              <span className="text-3xl font-bold text-primary">
                {plan.year}
              </span>
              <p className="text-xs text-muted-foreground">Årshjul</p>
            </div>
          </div>

          {/* Month segments */}
          {plan.months.map((month, index) => {
            const angle = (index * 30 - 90) * (Math.PI / 180);
            const radius = 42; // percentage from center
            const x = 50 + radius * Math.cos(angle);
            const y = 50 + radius * Math.sin(angle);

            return (
              <motion.div
                key={month.month}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                }}
                onClick={() => handleMonthClick(month)}
              >
                <div
                  className={cn(
                    "size-20 sm:size-24 rounded-full bg-linear-to-br border-2 flex flex-col items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg",
                    monthColors[index % 12]
                  )}
                >
                  <span
                    className={cn(
                      "text-lg sm:text-xl font-bold",
                      monthTextColors[index % 12]
                    )}
                  >
                    {month.monthName.slice(0, 3)}
                  </span>
                  <span className="text-xs text-muted-foreground text-center px-1 line-clamp-1 max-w-[4rem]">
                    {month.theme.split(" ").slice(0, 2).join(" ")}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* List View */}
      {view === "list" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {plan.months.map((month, index) => (
            <motion.div
              key={month.month}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={cn(
                  "cursor-pointer bg-linear-to-br border transition-all duration-300 hover:shadow-lg hover:scale-[1.02]",
                  monthColors[index % 12]
                )}
                onClick={() => handleMonthClick(month)}
              >
                <CardHeader className="pb-2">
                  <CardTitle
                    className={cn("text-lg", monthTextColors[index % 12])}
                  >
                    {month.monthName}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{month.theme}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Innlegg</span>
                      <span className="font-medium">{month.posts.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Merkedager</span>
                      <span className="font-medium">
                        {month.keyDates.length}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" className="w-full mt-2">
                      Se detaljer →
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Overall Tips */}
      {plan.overallTips.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="size-5 text-yellow-500" />
              Generelle tips for året
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2">
              {plan.overallTips.map((tip, index) => (
                <li key={tip} className="flex items-start gap-2 text-sm">
                  <span className="text-primary font-bold">{index + 1}.</span>
                  {tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Reset Button */}
      <div className="flex justify-center pt-4">
        <Button variant="outline" onClick={onReset} className="gap-2">
          <RefreshCcw className="size-4" />
          Lag nytt årshjul
        </Button>
      </div>
    </motion.div>
  );
}
