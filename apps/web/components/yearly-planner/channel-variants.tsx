"use client";

import { adaptPostStreamAction } from "@/lib/planner/actions/adapt-post";
import { readStreamableValue } from "@ai-sdk/rsc";
import {
  type AdaptedPostsStream,
  publishChannelLabels,
  publishChannelTypes,
} from "@poynt/planner-validators";
import { Badge, Button, Skeleton, toast } from "@poynt/ui";
import { Icon } from "@poynt/ui/icons";
import type { DeepPartial } from "ai";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

interface ChannelVariantsProps {
  /** Caption som skal tilpasses (originalen). */
  caption: string;
  /** Kanalen originalen ble skrevet for. */
  sourceChannel: string;
  /** Opprinnelig idé — ekstra kontekst. */
  idea?: string;
}

// Tekst-baserte kanaler det gir mening å tilpasse en caption til.
const ADAPTABLE_CHANNELS = publishChannelTypes.filter(
  (c) => c !== "podcast" && c !== "youtube"
);

const withHash = (tag: string) => (tag.startsWith("#") ? tag : `#${tag}`);

type Variant = NonNullable<
  NonNullable<DeepPartial<AdaptedPostsStream>["variants"]>[number]
>;

/**
 * Multi-kanal: lar brukeren velge andre kanaler og streame en tilpasset variant
 * av captionen til hver. Vises som en utvidbar seksjon under et ferdig innlegg.
 */
export function ChannelVariants({
  caption,
  sourceChannel,
  idea,
}: ChannelVariantsProps) {
  const [selected, setSelected] = useState<string[]>(["linkedin", "instagram"]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [hasRun, setHasRun] = useState(false);

  const toggle = (channel: string) => {
    setSelected((xs) =>
      xs.includes(channel) ? xs.filter((x) => x !== channel) : [...xs, channel]
    );
  };

  const adapt = async () => {
    if (selected.length === 0) return;
    setIsStreaming(true);
    setHasRun(true);
    setVariants([]);
    try {
      const stream = await adaptPostStreamAction({
        caption,
        sourceChannel,
        targetChannels: selected.map(
          (c) => publishChannelLabels[c as keyof typeof publishChannelLabels]
        ),
        idea,
      });
      for await (const partial of readStreamableValue(stream)) {
        if (!partial?.variants) continue;
        setVariants(
          partial.variants.filter((v): v is Variant =>
            Boolean(v?.channel || v?.caption)
          )
        );
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Kunne ikke tilpasse innlegget."
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const copyVariant = async (v: Variant) => {
    const tags =
      v.hashtags && v.hashtags.length > 0
        ? `\n\n${v.hashtags
            .filter((h): h is string => Boolean(h))
            .map(withHash)
            .join(" ")}`
        : "";
    try {
      await navigator.clipboard.writeText(`${v.caption ?? ""}${tags}`);
      toast("Varianten er kopiert");
    } catch {
      toast.error("Kunne ikke kopiere");
    }
  };

  return (
    <div className="space-y-4 rounded-lg border bg-muted/40 p-4">
      <div className="flex items-center gap-2">
        <Icon name="share" className="size-4 text-primary" />
        <p className="font-medium text-sm">Tilpass til andre kanaler</p>
      </div>

      {/* Kanal-valg */}
      <div className="flex flex-wrap gap-2">
        {ADAPTABLE_CHANNELS.map((channel) => {
          const active = selected.includes(channel);
          return (
            <button
              key={channel}
              type="button"
              onClick={() => toggle(channel)}
              disabled={isStreaming}
              className={
                active
                  ? "rounded-full border border-primary bg-primary/10 px-3 py-1 text-primary text-xs font-medium transition-colors"
                  : "rounded-full border bg-background px-3 py-1 text-muted-foreground text-xs transition-colors hover:bg-muted"
              }
            >
              {publishChannelLabels[channel]}
            </button>
          );
        })}
      </div>

      <Button
        size="sm"
        onClick={adapt}
        disabled={isStreaming || selected.length === 0}
        className="gap-2"
      >
        <Icon
          name={isStreaming ? "loader" : "sparkles"}
          className={isStreaming ? "size-4 animate-spin" : "size-4"}
        />
        {isStreaming
          ? "Tilpasser …"
          : hasRun
            ? "Tilpass på nytt"
            : `Tilpass til ${selected.length} ${
                selected.length === 1 ? "kanal" : "kanaler"
              }`}
      </Button>

      {/* Varianter */}
      <AnimatePresence>
        {variants.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {variants.map((v, i) => (
              <motion.div
                key={v.channel ?? `variant-${i}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border bg-card p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Badge variant="soft-primary" size="sm">
                    {v.channel ?? "Kanal"}
                  </Badge>
                  {v.caption && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyVariant(v)}
                    >
                      <Icon name="copy" className="size-4" />
                    </Button>
                  )}
                </div>
                {v.caption ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {v.caption}
                  </p>
                ) : (
                  <Skeleton className="h-4 w-3/4" />
                )}
                {v.hashtags && v.hashtags.length > 0 && (
                  <p className="mt-2 text-primary text-sm">
                    {v.hashtags
                      .filter((h): h is string => Boolean(h))
                      .map(withHash)
                      .join(" ")}
                  </p>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
