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

function formatDate(iso: string): string {
  const p = parseISODate(iso);
  if (!p) return "";
  return new Intl.DateTimeFormat("nb-NO", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(p.year, p.month - 1, p.day));
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
            <ul className="space-y-2">
              {upcoming.map((post) => {
                const meta = channelMeta(post.channel);
                return (
                  <li
                    key={post.id}
                    className="flex items-center gap-3 rounded-lg border bg-card p-2.5"
                  >
                    <div className="flex w-14 shrink-0 flex-col items-center text-center">
                      <span className="font-semibold text-primary text-xs capitalize">
                        {formatDate(post.iso)}
                      </span>
                    </div>
                    <span
                      className={cn("size-2 shrink-0 rounded-full", meta.dot)}
                    />
                    <span className="line-clamp-1 flex-1 text-sm">
                      {post.idea}
                    </span>
                    {post.channel && (
                      <Badge
                        variant="outline"
                        size="sm"
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
