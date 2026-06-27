"use client";

import { generatePostStreamAction } from "@/lib/planner/actions/generate-post";
import {
  type BusinessIdentity,
  SCHEDULED_POST_TOOL_ID,
  channelMeta,
  parseISODate,
} from "@/lib/planner/scheduled-posts";
import { trpc } from "@/lib/planner/trpc";
import { readStreamableValue } from "@ai-sdk/rsc";
import {
  type GeneratePostRequest,
  type PostAngle,
  postAngleLabels,
} from "@poynt/planner-validators";
import {
  AiBadge,
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
import { useCallback, useEffect, useRef, useState } from "react";
import { ChannelVariants } from "./channel-variants";
import { PostPreview } from "./post-preview";

interface PostComposerProps {
  /** Stabil referanse fra forelderen (state), så streamen ikke restarter. */
  post: GeneratePostRequest;
  /** ISO-dato innlegget skal ligge på i kalenderen. */
  scheduledDate?: string | null;
  /** Bedriftsnavn + logo til forhåndsvisningen. */
  business?: BusinessIdentity;
  onClose: () => void;
  /** Kalles når et innlegg er lagret/slettet, så kalenderen kan oppdatere seg. */
  onSaved?: () => void;
}

/** toolId vi lagrer genererte innlegg under (re-eksport for bakoverkomp.). */
export const GENERATED_POST_TOOL_ID = SCHEDULED_POST_TOOL_ID;

const withHash = (tag: string) => (tag.startsWith("#") ? tag : `#${tag}`);

function formatDate(iso: string): string {
  const parsed = parseISODate(iso);
  if (!parsed) return "";
  return new Intl.DateTimeFormat("nb-NO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(parsed.year, parsed.month - 1, parsed.day));
}

type SaveState = "idle" | "saving" | "saved" | "error";

/**
 * Drill-down: streamer ett ferdig innlegg (caption + hashtags + bilde-tips) fra
 * en post-idé, i bedriftens stemme (via merkevarebriefen). AUTO-LAGRES til
 * kalenderen når streamen er ferdig — og oppdateres (ikke duplikat) hvis
 * brukeren lager et nytt forslag. Bygd på den ekte Dialog-en (scroll-lås).
 */
export function PostComposer({
  post,
  scheduledDate,
  business,
  onClose,
  onSaved,
}: PostComposerProps) {
  const [open, setOpen] = useState(true);
  const [isStreaming, setIsStreaming] = useState(true);
  const [postType, setPostType] = useState<PostAngle | null>(null);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [imageTip, setImageTip] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [showVariants, setShowVariants] = useState(false);
  // Id-en på den lagrede raden — så «Lag nytt forslag» oppdaterer i stedet for
  // å lage et duplikat i kalenderen.
  const savedIdRef = useRef<string | null>(null);

  const channel = channelMeta(post.channel);

  const persist = useCallback(
    async (final: {
      postType: PostAngle | null;
      caption: string;
      hashtags: string[];
      imageTip: string;
    }) => {
      if (!final.caption) return;
      setSaveState("saving");
      const result = {
        postType: final.postType,
        caption: final.caption,
        hashtags: final.hashtags,
        imageTip: final.imageTip,
        channel: post.channel,
        idea: post.idea,
        monthName: post.monthName ?? null,
        scheduledDate: scheduledDate ?? null,
        source: "ai" as const,
      };
      try {
        if (savedIdRef.current) {
          await trpc.toolResult.update.mutate({
            id: savedIdRef.current,
            title: post.idea.slice(0, 80),
            result,
          });
        } else {
          const row = await trpc.toolResult.save.mutate({
            toolId: SCHEDULED_POST_TOOL_ID,
            title: post.idea.slice(0, 80),
            inputs: { ...post, scheduledDate: scheduledDate ?? null },
            result,
          });
          if (row) savedIdRef.current = row.id;
        }
        setSaveState("saved");
        onSaved?.();
      } catch {
        setSaveState("error");
      }
    },
    [post, scheduledDate, onSaved]
  );

  const generate = useCallback(
    async (isActive: () => boolean) => {
      setIsStreaming(true);
      setSaveState("idle");
      setPostType(null);
      setCaption("");
      setHashtags([]);
      setImageTip("");
      const final = {
        postType: null as PostAngle | null,
        caption: "",
        hashtags: [] as string[],
        imageTip: "",
      };
      try {
        const stream = await generatePostStreamAction(post);
        for await (const partial of readStreamableValue(stream)) {
          if (!isActive() || !partial) continue;
          if (partial.postType != null) {
            final.postType = partial.postType as PostAngle;
            setPostType(final.postType);
          }
          if (partial.caption != null) {
            final.caption = partial.caption;
            setCaption(final.caption);
          }
          if (partial.hashtags) {
            final.hashtags = partial.hashtags.filter((h): h is string =>
              Boolean(h)
            );
            setHashtags(final.hashtags);
          }
          if (partial.imageTip != null) {
            final.imageTip = partial.imageTip;
            setImageTip(final.imageTip);
          }
        }
      } catch (error) {
        if (isActive()) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Kunne ikke lage innlegget."
          );
        }
        return;
      } finally {
        if (isActive()) setIsStreaming(false);
      }
      // Auto-lagre når streamen er ferdig.
      if (isActive()) await persist(final);
    },
    [post, persist]
  );

  useEffect(() => {
    let active = true;
    generate(() => active);
    return () => {
      active = false;
    };
  }, [generate]);

  const copyAll = async () => {
    const tags =
      hashtags.length > 0 ? `\n\n${hashtags.map(withHash).join(" ")}` : "";
    try {
      await navigator.clipboard.writeText(`${caption}${tags}`);
      toast("Innlegget er kopiert");
    } catch {
      toast.error("Kunne ikke kopiere");
    }
  };

  const remove = async () => {
    if (savedIdRef.current) {
      try {
        await trpc.toolResult.delete.mutate({ id: savedIdRef.current });
      } catch {
        // best effort
      }
    }
    onSaved?.();
    handleClose();
  };

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleClose();
      }}
    >
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>Forslag til innlegg</DialogTitle>
            <AiBadge />
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="outline" size="sm" className={channel.chip}>
              {post.channel}
            </Badge>
            {postType && (
              <Badge variant="soft-primary" size="sm">
                {postAngleLabels[postType]}
              </Badge>
            )}
            {scheduledDate && (
              <span className="flex items-center gap-1 text-muted-foreground text-xs">
                <Icon name="calendar" className="size-3.5" />
                {formatDate(scheduledDate)}
              </span>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-5">
          {isStreaming && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Icon name="loader" className="size-4 animate-spin" />
              Skriver innlegget i stemmen deres …
            </div>
          )}

          {/* Forhåndsvisning slik innlegget ser ut på kanalen */}
          {caption ? (
            <PostPreview
              channel={post.channel}
              caption={caption}
              hashtags={hashtags}
              businessName={business?.name}
              logoUrl={business?.logoUrl}
            />
          ) : (
            isStreaming && (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            )
          )}

          {/* Bilde-tips */}
          {imageTip && (
            <div className="flex gap-3 rounded-lg border bg-card p-4">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Icon name="image" className="size-4" />
              </div>
              <div>
                <p className="mb-1 font-medium text-sm">Bilde-tips</p>
                <Text variant="muted" customStyles="text-sm">
                  {imageTip}
                </Text>
              </div>
            </div>
          )}

          {!isStreaming && (
            <>
              {/* Auto-lagre-status */}
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                {saveState === "saving" && (
                  <>
                    <Icon name="loader" className="size-3.5 animate-spin" />
                    Lagrer i kalenderen …
                  </>
                )}
                {saveState === "saved" && (
                  <>
                    <Icon name="check" className="size-3.5 text-primary" />
                    Lagret i kalenderen
                  </>
                )}
                {saveState === "error" && (
                  <span className="text-destructive">
                    Kunne ikke lagre automatisk
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button onClick={copyAll} className="gap-2">
                  <Icon name="copy" className="size-4" />
                  Kopier innlegget
                </Button>
                {caption && (
                  <Button
                    variant="outline"
                    onClick={() => setShowVariants((v) => !v)}
                    className="gap-2"
                  >
                    <Icon name="share" className="size-4" />
                    {showVariants ? "Skjul kanaler" : "Andre kanaler"}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => generate(() => true)}
                  className="gap-2"
                >
                  <Icon name="refresh" className="size-4" />
                  Nytt forslag
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={remove}
                  aria-label="Fjern innlegget"
                  className="ml-auto text-muted-foreground hover:text-destructive"
                >
                  <Icon name="trash" className="size-4" />
                </Button>
              </div>
            </>
          )}

          {!isStreaming && showVariants && caption && (
            <ChannelVariants
              caption={caption}
              sourceChannel={post.channel}
              idea={post.idea}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
