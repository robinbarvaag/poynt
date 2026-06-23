"use client";

import type { MonthContent, YearlyPlan } from "@poynt/planner-validators";
import { AiBadge, Card, CardContent, CardHeader, CardTitle } from "@poynt/ui";
import { Button } from "@poynt/ui";
import { Tabs, TabsList, TabsTrigger } from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import { cn } from "@poynt/ui/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

interface PlannerResultProps {
  plan: YearlyPlan;
  onReset: () => void;
}

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
          className="inline-flex items-center justify-center size-16 rounded-full bg-primary/10 text-primary mb-2"
        >
          <Icon name="calendar-days" className="size-8" />
        </motion.div>
        <h2 className="text-3xl font-bold tracking-tight">
          Ditt årshjul {plan.year}
        </h2>
        <p className="text-muted-foreground text-lg mx-auto">{plan.summary}</p>
        <AiBadge className="mt-1" />
      </div>

      {/* View Toggle */}
      <div className="flex justify-center">
        <Tabs
          value={view}
          onValueChange={(v) => setView(v as "wheel" | "list")}
        >
          <TabsList>
            <TabsTrigger value="wheel" className="gap-2">
              <Icon name="calendar-days" className="size-4" />
              Årshjul
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <Icon name="calendar" className="size-4" />
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
              <Card className="bg-muted border">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigateMonth("prev")}
                    >
                      <Icon name="chevron-left" className="size-5" />
                    </Button>
                    <div className="text-center">
                      <CardTitle className="text-2xl">
                        {selectedMonth.monthName}
                      </CardTitle>
                      <p className="text-sm font-medium text-muted-foreground">
                        {selectedMonth.theme}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigateMonth("next")}
                    >
                      <Icon name="chevron-right" className="size-5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Posts */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Icon name="calendar-days" className="size-4" />
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
                        <Icon name="calendar" className="size-4" />
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
                        <Icon name="lightbulb" className="size-4" />
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
                    "size-20 sm:size-24 rounded-full border-2 flex flex-col items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg",
                    selectedMonth?.month === month.month
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-muted border-border text-foreground"
                  )}
                >
                  <span className="text-lg sm:text-xl font-bold">
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
                className="cursor-pointer bg-muted border transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                onClick={() => handleMonthClick(month)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-foreground">
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
              <Icon name="lightbulb" className="size-5 text-primary" />
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
          <Icon name="refresh" className="size-4" />
          Lag nytt årshjul
        </Button>
      </div>
    </motion.div>
  );
}
