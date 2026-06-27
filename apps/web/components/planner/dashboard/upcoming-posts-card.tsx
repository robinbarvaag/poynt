"use client";

import {
  SCHEDULED_POST_TOOL_ID,
  type ScheduledPost,
  channelMeta,
  parseISODate,
  toISODate,
} from "@/lib/planner/scheduled-posts";
import { trpc } from "@/lib/planner/trpc";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  Text,
  cn,
} from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface Upcoming {
  id: string;
  iso: string;
  channel: string;
  idea: string;
}

/** Dato som dag + måned for en liten kalender-flis (tydeligere enn én linje). */
function formatDay(iso: string): { day: string; month: string } {
  const p = parseISODate(iso);
  if (!p) return { day: "", month: "" };
  const d = new Date(p.year, p.month - 1, p.day);
  return {
    day: String(p.day),
    month: new Intl.DateTimeFormat("nb-NO", { month: "short" })
      .format(d)
      .replace(".", ""),
  };
}

/**
 * «Kommende innlegg» på dashbordet — de neste planlagte innleggene fra
 * årshjul-kalenderen. Knytter dashbordet til kalenderen, så oppgaver og innhold
 * lever side om side.
 */
export function UpcomingPostsCard() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const rows = await trpc.toolResult.list.query({
          toolId: SCHEDULED_POST_TOOL_ID,
          limit: 100,
        });
        if (active) setPosts(rows as unknown as ScheduledPost[]);
      } catch {
        // stille
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const upcoming = useMemo<Upcoming[]>(() => {
    const now = new Date();
    const today = toISODate(
      now.getFullYear(),
      now.getMonth() + 1,
      now.getDate()
    );
    return posts
      .map((p) => ({
        id: p.id,
        iso: p.result?.scheduledDate ?? "",
        channel: p.result?.channel ?? "",
        idea: p.result?.idea ?? p.result?.caption ?? "Innlegg",
      }))
      .filter((p) => p.iso && p.iso >= today)
      .sort((a, b) => a.iso.localeCompare(b.iso))
      .slice(0, 5);
  }, [posts]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Icon name="calendar-days" className="size-5 text-primary" />
          Kommende innlegg
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-5/6" />
          </div>
        ) : upcoming.length === 0 ? (
          <div className="py-2">
            <Text variant="muted" customStyles="text-sm">
              Ingen planlagte innlegg fremover. Åpne årshjulet for å planlegge
              innholdet ditt.
            </Text>
            <Button asChild variant="outline" size="sm" className="mt-3 gap-2">
              <Link href="/on-poynt/verktoy/arsplanlegger">
                <Icon name="calendar-days" className="size-4" />
                Til årshjulet
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <ul className="-my-1 divide-y divide-border/70">
              {upcoming.map((post) => {
                const meta = channelMeta(post.channel);
                const d = formatDay(post.iso);
                return (
                  <li key={post.id} className="flex items-center gap-4 py-3">
                    <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-muted">
                      <span className="font-bold text-base leading-none">
                        {d.day}
                      </span>
                      <span className="text-[11px] text-muted-foreground uppercase">
                        {d.month}
                      </span>
                    </div>
                    <p className="line-clamp-2 flex-1 font-medium text-sm leading-snug">
                      {post.idea}
                    </p>
                    {post.channel && (
                      <Badge
                        variant="outline"
                        className={cn("shrink-0", meta.chip)}
                      >
                        {post.channel}
                      </Badge>
                    )}
                  </li>
                );
              })}
            </ul>
            <Button asChild variant="link" size="sm" className="h-auto p-0">
              <Link href="/on-poynt/verktoy/arsplanlegger">
                Se hele kalenderen →
              </Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
