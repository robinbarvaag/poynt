"use client";

import {
  type BusinessIdentity,
  CHANNEL_META,
  type ScheduledPost,
  channelMeta,
  deriveDay,
  deriveISODate,
  normalizeChannel,
  parseISODate,
  toISODate,
} from "@/lib/planner/scheduled-posts";
import { trpc } from "@/lib/planner/trpc";
import type {
  GeneratePostRequest,
  MonthContent,
} from "@poynt/planner-validators";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  toast,
} from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import { cn } from "@poynt/ui/lib/utils";
import type { DeepPartial } from "ai";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { ChannelVariants } from "./channel-variants";
import { DayComposer } from "./day-composer";
import { PostPreview } from "./post-preview";

type PartialMonth = DeepPartial<MonthContent>;

interface PlannerCalendarProps {
  /** Måneder fra årshjulet (allerede filtrert: monthName finnes). */
  months: PartialMonth[];
  year?: number;
  /** Planlagte/lagrede innlegg (hentes av forelderen). */
  scheduled: ScheduledPost[];
  /** Bedriftsnavn + logo til forhåndsvisningen. */
  business: BusinessIdentity;
  /** Åpne AI-drilldown for et innlegg på en gitt dato. */
  onComposePost: (post: GeneratePostRequest, isoDate: string) => void;
  /** Be forelderen hente på nytt (etter manuelt innlegg / sletting). */
  onChanged: () => void;
  /** Hvilken måned som vises (kontrollert, så «Oversikt» kan hoppe hit). */
  monthIndex: number;
  onMonthIndexChange: (index: number) => void;
}

const WEEKDAYS = ["Ma", "Ti", "On", "To", "Fr", "Lø", "Sø"];

const withHash = (tag: string) => (tag.startsWith("#") ? tag : `#${tag}`);

interface IdeaPost {
  channel: string;
  idea: string;
  type?: string;
  week: number;
}

function formatLongDate(iso: string): string {
  const p = parseISODate(iso);
  if (!p) return "";
  return new Intl.DateTimeFormat("nb-NO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(p.year, p.month - 1, p.day));
}

/**
 * Innholdskalender: én måned av gangen som et ekte rutenett. Viser BÅDE de
 * lagrede/planlagte innleggene (kanal-fargede, på sin dato) og årshjul-forslagene
 * (lysere). Trykk på en dag → opprett (AI/manuelt). Trykk på et forslag → lag
 * ferdig innlegg. Trykk på et lagret innlegg → se/kopier/slett.
 */
export function PlannerCalendar({
  months,
  year,
  scheduled,
  business,
  onComposePost,
  onChanged,
  monthIndex,
  onMonthIndexChange,
}: PlannerCalendarProps) {
  const [dayComposerDate, setDayComposerDate] = useState<string | null>(null);
  const [detail, setDetail] = useState<ScheduledPost | null>(null);
  const [detailVariants, setDetailVariants] = useState(false);

  const safeIndex = Math.min(
    Math.max(monthIndex, 0),
    Math.max(months.length - 1, 0)
  );
  const month = months[safeIndex];
  const calYear = year || new Date().getFullYear();
  const monthNum = month?.month ?? safeIndex + 1;

  const openDetail = (post: ScheduledPost) => {
    setDetailVariants(false);
    setDetail(post);
  };

  // Forslag (fra årshjulet) gruppert på utledet dag.
  const ideasByDay = useMemo(() => {
    const map = new Map<number, IdeaPost[]>();
    for (const post of month?.posts ?? []) {
      if (!post?.idea) continue;
      const week = post.week ?? 1;
      const day = deriveDay(week);
      const list = map.get(day) ?? [];
      list.push({
        channel: post.channel ?? "",
        idea: post.idea,
        type: post.type ?? undefined,
        week,
      });
      map.set(day, list);
    }
    return map;
  }, [month]);

  // Planlagte innlegg i denne måneden, gruppert på dag.
  const scheduledByDay = useMemo(() => {
    const map = new Map<number, ScheduledPost[]>();
    for (const post of scheduled) {
      const p = parseISODate(post.result?.scheduledDate ?? null);
      if (!p || p.year !== calYear || p.month !== monthNum) continue;
      const list = map.get(p.day) ?? [];
      list.push(post);
      map.set(p.day, list);
    }
    return map;
  }, [scheduled, calYear, monthNum]);

  // Idéer som allerede er gjort om til lagrede innlegg denne måneden — så vi
  // ikke viser både forslaget OG det ferdige innlegget (dobbelt opp).
  const scheduledIdeaSet = useMemo(() => {
    const set = new Set<string>();
    for (const post of scheduled) {
      const p = parseISODate(post.result?.scheduledDate ?? null);
      if (!p || p.year !== calYear || p.month !== monthNum) continue;
      const idea = post.result?.idea?.trim().toLowerCase();
      if (idea) set.add(idea);
    }
    return set;
  }, [scheduled, calYear, monthNum]);

  // Kanaler i bruk denne måneden — til fargeforklaringen.
  const usedChannels = useMemo(() => {
    const set = new Set<string>();
    for (const post of scheduled) {
      const p = parseISODate(post.result?.scheduledDate ?? null);
      if (!p || p.year !== calYear || p.month !== monthNum) continue;
      set.add(normalizeChannel(post.result?.channel));
    }
    return [...set];
  }, [scheduled, calYear, monthNum]);

  const daysInMonth = new Date(calYear, monthNum, 0).getDate();
  const leadingBlanks = (new Date(calYear, monthNum - 1, 1).getDay() + 6) % 7;

  if (!month) return null;

  const cells: (number | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Måneds-info (lå tidligere i en egen modal) — vises nå under kalenderen.
  const monthTips = (month.tips ?? []).filter((t): t is string => Boolean(t));
  const monthKeyDates = (month.keyDates ?? []).filter(
    (kd): kd is NonNullable<typeof kd> => Boolean(kd?.event)
  );

  const deleteDetail = async () => {
    if (!detail) return;
    try {
      await trpc.toolResult.delete.mutate({ id: detail.id });
      toast("Innlegget er slettet");
      setDetail(null);
      onChanged();
    } catch {
      toast.error("Kunne ikke slette innlegget");
    }
  };

  const copyDetail = async () => {
    const r = detail?.result;
    if (!r?.caption) return;
    const tags =
      r.hashtags && r.hashtags.length > 0
        ? `\n\n${r.hashtags.map(withHash).join(" ")}`
        : "";
    try {
      await navigator.clipboard.writeText(`${r.caption}${tags}`);
      toast("Innlegget er kopiert");
    } catch {
      toast.error("Kunne ikke kopiere");
    }
  };

  return (
    <Card className="mx-auto max-w-4xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onMonthIndexChange(Math.max(0, safeIndex - 1))}
            disabled={safeIndex === 0}
            aria-label="Forrige måned"
          >
            <Icon name="chevron-left" className="size-5" />
          </Button>
          <div className="text-center">
            <p className="font-semibold text-lg">
              {month.monthName}{" "}
              <span className="text-muted-foreground">{calYear}</span>
            </p>
            {month.theme && (
              <p className="text-muted-foreground text-sm">{month.theme}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              onMonthIndexChange(Math.min(months.length - 1, safeIndex + 1))
            }
            disabled={safeIndex >= months.length - 1}
            aria-label="Neste måned"
          >
            <Icon name="chevron-right" className="size-5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Ukedag-rad */}
        <div className="mb-1 grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="py-1 text-center font-medium text-muted-foreground text-xs"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Dag-rutenett */}
        <motion.div
          key={safeIndex}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-7 gap-1"
        >
          {cells.map((day, i) => {
            if (day === null) {
              return (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: faste ledende tomceller
                  key={`blank-${i}`}
                  className="min-h-24 rounded-md"
                />
              );
            }
            const dayScheduled = scheduledByDay.get(day) ?? [];
            // Skjul forslag som allerede er gjort om til et lagret innlegg.
            const dayIdeas = (ideasByDay.get(day) ?? []).filter(
              (idea) => !scheduledIdeaSet.has(idea.idea.trim().toLowerCase())
            );
            const isoDate = toISODate(calYear, monthNum, day);
            const hasContent = dayIdeas.length > 0 || dayScheduled.length > 0;
            const weekday = (leadingBlanks + day - 1) % 7;
            const isWeekend = weekday >= 5;

            return (
              <div
                key={day}
                // biome-ignore lint/a11y/useSemanticElements: cellen inneholder egne knapper — <button> ville gitt nested buttons (ugyldig HTML)
                role="button"
                tabIndex={0}
                onClick={() => setDayComposerDate(isoDate)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setDayComposerDate(isoDate);
                  }
                }}
                className={cn(
                  "group min-h-24 cursor-pointer rounded-md border p-1.5 text-left transition-colors hover:border-primary/50 hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  hasContent
                    ? "bg-primary/5"
                    : isWeekend
                      ? "bg-muted/40"
                      : "bg-card"
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "text-xs",
                      hasContent
                        ? "font-semibold text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    {day}
                  </span>
                  <span className="flex items-center gap-0.5 text-[9px] text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    <Icon name="plus" className="size-3" />
                  </span>
                </div>

                <div className="mt-1 space-y-1">
                  {/* Lagrede/planlagte innlegg (kanal-farget, solid) */}
                  {dayScheduled.map((post) => {
                    const meta = channelMeta(post.result?.channel);
                    return (
                      <button
                        key={post.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetail(post);
                        }}
                        className={cn(
                          "flex w-full items-start gap-1 rounded border px-1 py-0.5 text-left text-[10px] leading-tight transition hover:brightness-95",
                          meta.chip
                        )}
                        title={`${post.result?.channel ?? ""} — trykk for å se, kopiere eller slette`}
                      >
                        <span
                          className={cn(
                            "mt-1 size-1.5 shrink-0 rounded-full",
                            meta.dot
                          )}
                        />
                        <span className="line-clamp-2 font-medium">
                          {post.result?.idea ??
                            post.result?.caption ??
                            "Innlegg"}
                        </span>
                      </button>
                    );
                  })}

                  {/* Forslag fra årshjulet (stiplet — trykk for å lage innlegg) */}
                  {dayIdeas.map((idea) => (
                    <button
                      key={`${idea.channel}-${idea.idea}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onComposePost(
                          {
                            channel: idea.channel,
                            idea: idea.idea,
                            type: idea.type,
                            monthName: month.monthName ?? undefined,
                          },
                          deriveISODate(calYear, monthNum, idea.week)
                        );
                      }}
                      className="flex w-full items-start gap-1 rounded border border-dashed border-muted-foreground/30 bg-background/60 px-1 py-0.5 text-left text-[10px] text-muted-foreground leading-tight transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-foreground"
                      title={`Forslag · ${idea.channel}: ${idea.idea} — trykk for å lage innlegget`}
                    >
                      <Icon
                        name="sparkles"
                        className="mt-px size-2.5 shrink-0 text-primary/70"
                      />
                      <span className="line-clamp-2">{idea.idea}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Fargeforklaring + hjelp */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 border-t pt-3 text-muted-foreground text-xs">
          {usedChannels.map((key) => (
            <span key={key} className="flex items-center gap-1.5">
              <span
                className={cn(
                  "size-2 rounded-full",
                  CHANNEL_META[key as keyof typeof CHANNEL_META].dot
                )}
              />
              {CHANNEL_META[key as keyof typeof CHANNEL_META].label}
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <Icon name="sparkles" className="size-3 text-primary/70" />
            Forslag fra årshjulet
          </span>
        </div>
        <p className="mt-2 text-center text-muted-foreground text-xs">
          Trykk på en dag for å lage et innlegg — eller på et forslag for å
          fylle det ut.
        </p>

        {/* Måneds-info: viktige datoer + tips (lå før i en egen modal) */}
        {(monthKeyDates.length > 0 || monthTips.length > 0) && (
          <div className="mt-5 grid gap-5 border-t pt-5 sm:grid-cols-2">
            {monthKeyDates.length > 0 && (
              <div>
                <h4 className="mb-2 flex items-center gap-1.5 font-semibold text-sm">
                  <Icon name="calendar" className="size-4 text-primary" />
                  Viktige datoer
                </h4>
                <ul className="space-y-2">
                  {monthKeyDates.map((kd) => (
                    <li key={`${kd.date}-${kd.event}`} className="text-sm">
                      <span className="font-medium text-primary">
                        {kd.date}
                      </span>{" "}
                      {kd.event}
                      {kd.contentIdea && (
                        <span className="mt-0.5 block text-muted-foreground text-xs">
                          {kd.contentIdea}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {monthTips.length > 0 && (
              <div>
                <h4 className="mb-2 flex items-center gap-1.5 font-semibold text-sm">
                  <Icon name="lightbulb" className="size-4 text-primary" />
                  Tips for måneden
                </h4>
                <ul className="space-y-1.5">
                  {monthTips.map((tip) => (
                    <li
                      key={tip}
                      className="flex items-start gap-2 text-muted-foreground text-sm"
                    >
                      <span className="text-primary">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Opprett på en dag */}
      {dayComposerDate && (
        <DayComposer
          isoDate={dayComposerDate}
          onClose={() => setDayComposerDate(null)}
          onCreateAI={onComposePost}
          onSaved={onChanged}
        />
      )}

      {/* Detalj for et lagret innlegg */}
      <Dialog
        open={detail !== null}
        onOpenChange={(o) => {
          if (!o) setDetail(null);
        }}
      >
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle>Innlegg</DialogTitle>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Badge
                    variant="outline"
                    size="sm"
                    className={channelMeta(detail.result?.channel).chip}
                  >
                    {detail.result?.channel ?? "Kanal"}
                  </Badge>
                  {detail.result?.scheduledDate && (
                    <span className="flex items-center gap-1 text-muted-foreground text-xs capitalize">
                      <Icon name="calendar" className="size-3.5" />
                      {formatLongDate(detail.result.scheduledDate)}
                    </span>
                  )}
                  {detail.result?.source === "manual" && (
                    <Badge variant="muted" size="sm">
                      Manuelt
                    </Badge>
                  )}
                </div>
              </DialogHeader>

              <div className="space-y-4">
                {detail.result?.caption && (
                  <PostPreview
                    channel={detail.result.channel ?? ""}
                    caption={detail.result.caption}
                    hashtags={detail.result.hashtags}
                    businessName={business.name}
                    logoUrl={business.logoUrl}
                  />
                )}
                {detail.result?.imageTip && (
                  <p className="flex items-start gap-1.5 text-muted-foreground text-sm">
                    <Icon
                      name="image"
                      className="mt-0.5 size-3.5 shrink-0 text-primary"
                    />
                    {detail.result.imageTip}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={copyDetail} className="gap-2">
                    <Icon name="copy" className="size-4" />
                    Kopier
                  </Button>
                  {detail.result?.caption && (
                    <Button
                      variant="outline"
                      onClick={() => setDetailVariants((v) => !v)}
                      className="gap-2"
                    >
                      <Icon name="share" className="size-4" />
                      {detailVariants ? "Skjul kanaler" : "Andre kanaler"}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={deleteDetail}
                    aria-label="Slett innlegget"
                    className="ml-auto text-muted-foreground hover:text-destructive"
                  >
                    <Icon name="trash" className="size-4" />
                  </Button>
                </div>

                {detailVariants && detail.result?.caption && (
                  <ChannelVariants
                    caption={detail.result.caption}
                    sourceChannel={detail.result.channel ?? ""}
                    idea={detail.result.idea}
                  />
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
