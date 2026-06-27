"use client";

import {
  SCHEDULED_POST_TOOL_ID,
  type ScheduledPost,
  channelMeta,
  parseISODate,
} from "@/lib/planner/scheduled-posts";
import { trpc } from "@/lib/planner/trpc";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Skeleton,
  Text,
  toast,
} from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import { cn } from "@poynt/ui/lib/utils";
import { useEffect, useState } from "react";

const withHash = (tag: string) => (tag.startsWith("#") ? tag : `#${tag}`);

function formatDate(post: ScheduledPost): string {
  const iso = post.result?.scheduledDate;
  const parsed = parseISODate(iso ?? null);
  const date = parsed
    ? new Date(parsed.year, parsed.month - 1, parsed.day)
    : new Date(post.createdAt);
  return new Intl.DateTimeFormat("nb-NO", {
    day: "numeric",
    month: "short",
  }).format(date);
}

/**
 * Liste over lagrede/planlagte innlegg. Henter ferskt hver gang den åpnes. Lar
 * brukeren kopiere eller slette dem. Bygd på den ekte Dialog-en (scroll-lås).
 */
export function SavedPostsDialog({
  onClose,
  onChanged,
}: {
  onClose: () => void;
  onChanged?: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ScheduledPost[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const rows = await trpc.toolResult.list.query({
          toolId: SCHEDULED_POST_TOOL_ID,
          limit: 100,
        });
        if (active) setItems(rows as unknown as ScheduledPost[]);
      } catch {
        if (active) toast.error("Kunne ikke hente lagrede innlegg.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const close = () => {
    setOpen(false);
    onClose();
  };

  const copy = async (post: ScheduledPost) => {
    const r = post.result;
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

  const remove = async (id: string) => {
    try {
      await trpc.toolResult.delete.mutate({ id });
      setItems((xs) => xs.filter((x) => x.id !== id));
      onChanged?.();
      toast("Innlegget er slettet");
    } catch {
      toast.error("Kunne ikke slette innlegget");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) close();
      }}
    >
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lagrede innlegg</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : items.length === 0 ? (
            <div className="py-8 text-center">
              <Text variant="muted">
                Ingen lagrede innlegg enda. Lag et innlegg fra kalenderen eller
                årshjulet — det lagres automatisk her.
              </Text>
            </div>
          ) : (
            items.map((post) => {
              const r = post.result;
              const isOpen = expandedId === post.id;
              const meta = channelMeta(r?.channel);
              return (
                <div key={post.id} className="rounded-lg border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {r?.channel && (
                          <Badge
                            variant="outline"
                            size="sm"
                            className={meta.chip}
                          >
                            {r.channel}
                          </Badge>
                        )}
                        <span className="text-muted-foreground text-xs">
                          {formatDate(post)}
                        </span>
                        {r?.source === "manual" && (
                          <Badge variant="muted" size="sm">
                            Manuelt
                          </Badge>
                        )}
                      </div>
                      {r?.idea && (
                        <p className="truncate font-medium text-sm">{r.idea}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copy(post)}
                      >
                        <Icon name="copy" className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(post.id)}
                      >
                        <Icon name="trash" className="size-4" />
                      </Button>
                    </div>
                  </div>

                  {r?.caption && (
                    <>
                      <p
                        className={cn(
                          "mt-3 text-muted-foreground text-sm",
                          isOpen
                            ? "whitespace-pre-wrap leading-relaxed"
                            : "line-clamp-2"
                        )}
                      >
                        {r.caption}
                      </p>
                      <Button
                        variant="link"
                        size="sm"
                        className="mt-1 h-auto p-0 text-muted-foreground"
                        onClick={() => setExpandedId(isOpen ? null : post.id)}
                      >
                        {isOpen ? "Skjul" : "Vis hele"}
                      </Button>
                    </>
                  )}

                  {isOpen && r?.hashtags && r.hashtags.length > 0 && (
                    <p className="mt-2 text-primary text-sm">
                      {r.hashtags.map(withHash).join(" ")}
                    </p>
                  )}

                  {isOpen && r?.imageTip && (
                    <p className="mt-2 flex items-start gap-1.5 text-muted-foreground text-sm">
                      <Icon
                        name="image"
                        className="mt-0.5 size-3.5 shrink-0 text-primary"
                      />
                      {r.imageTip}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
