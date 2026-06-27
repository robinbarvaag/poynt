"use client";

import {
  type ChannelKey,
  channelMeta,
  normalizeChannel,
  stripTrailingHashtags,
} from "@/lib/planner/scheduled-posts";
import { Icon } from "@poynt/ui/icons";
import { cn } from "@poynt/ui/lib/utils";

interface PostPreviewProps {
  channel: string;
  caption: string;
  hashtags?: string[];
  /** Vises som «bilde» i Instagram-preview (motivforslaget). */
  imageTip?: string | null;
  businessName?: string;
  /** Logo (favicon) — vises i stedet for initialer hvis satt. */
  logoUrl?: string | null;
}

const withHash = (tag: string) => (tag.startsWith("#") ? tag : `#${tag}`);

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "B"
  );
}

/**
 * Lettvekts «slik ser innlegget ut»-preview — etterligner chromet til hver kanal
 * (LinkedIn/Instagram/Facebook) for en kul, gjenkjennelig effekt. Ren UI, ingen
 * ekstern pakke (de fleste npm-pakker embed-er ekte, publiserte innlegg via URL,
 * ikke utkast).
 */
export function PostPreview({
  channel,
  caption,
  hashtags = [],
  imageTip,
  businessName = "Din bedrift",
  logoUrl,
}: PostPreviewProps) {
  const key = normalizeChannel(channel);
  const meta = channelMeta(channel);
  const body = stripTrailingHashtags(caption);
  const tagLine = hashtags.length > 0 ? hashtags.map(withHash).join(" ") : "";

  const Avatar = logoUrl ? (
    <img
      src={logoUrl}
      alt={businessName}
      className="size-9 shrink-0 rounded-full border bg-white object-contain p-0.5"
    />
  ) : (
    <div
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full font-semibold text-[11px] text-white",
        meta.dot
      )}
    >
      {initials(businessName)}
    </div>
  );

  // Instagram: bilde øverst, caption under.
  if (key === "instagram") {
    return (
      <Frame channelKey={key}>
        <div className="flex items-center gap-2 p-3">
          {Avatar}
          <span className="font-semibold text-sm">
            {businessName.toLowerCase().replace(/\s+/g, "")}
          </span>
          <Icon
            name="more-horizontal"
            className="ml-auto size-4 text-muted-foreground"
          />
        </div>
        <div className="relative flex aspect-square items-center justify-center bg-linear-to-br from-muted to-muted/40 px-6 text-center">
          <div className="space-y-2 text-muted-foreground">
            <Icon name="image" className="mx-auto size-8 opacity-60" />
            {imageTip && <p className="text-xs leading-snug">{imageTip}</p>}
          </div>
        </div>
        <div className="flex items-center gap-4 px-3 pt-3">
          <Icon name="heart" className="size-5" />
          <Icon name="message-square" className="size-5" />
          <Icon name="send" className="size-5" />
        </div>
        <div className="space-y-1 p-3 pt-2 text-sm">
          <p className="whitespace-pre-wrap leading-snug">
            <span className="font-semibold">
              {businessName.toLowerCase().replace(/\s+/g, "")}
            </span>{" "}
            {body}
          </p>
          {tagLine && <p className="text-sky-600">{tagLine}</p>}
        </div>
      </Frame>
    );
  }

  // LinkedIn / Facebook / generisk: header + tekst + handlingsrad.
  const subtitle =
    key === "linkedin"
      ? "1. forbindelse · 2t"
      : key === "facebook"
        ? "2 t · 🌐"
        : meta.label;

  return (
    <Frame channelKey={key}>
      <div className="flex items-center gap-2.5 p-3">
        {Avatar}
        <div className="min-w-0">
          <p className="font-semibold text-sm leading-tight">{businessName}</p>
          <p className="text-muted-foreground text-xs">{subtitle}</p>
        </div>
        <Icon
          name="more-horizontal"
          className="ml-auto size-4 text-muted-foreground"
        />
      </div>
      <div className="space-y-2 px-3 pb-3 text-sm">
        <p className="whitespace-pre-wrap leading-relaxed">{body}</p>
        {tagLine && <p className="text-sky-600">{tagLine}</p>}
      </div>
      {imageTip && (
        <div className="mx-3 mb-3 flex items-center gap-2 rounded-md border border-dashed bg-muted/40 px-3 py-2 text-muted-foreground text-xs">
          <Icon name="image" className="size-4 shrink-0" />
          <span className="line-clamp-2">{imageTip}</span>
        </div>
      )}
      <div className="flex items-center justify-around border-t py-1.5 text-muted-foreground text-xs">
        <span className="flex items-center gap-1.5">
          <Icon name="thumbs-up" className="size-4" />
          Liker
        </span>
        <span className="flex items-center gap-1.5">
          <Icon name="message-square" className="size-4" />
          Kommenter
        </span>
        <span className="flex items-center gap-1.5">
          <Icon name="share" className="size-4" />
          Del
        </span>
      </div>
    </Frame>
  );
}

function Frame({
  channelKey,
  children,
}: {
  channelKey: ChannelKey;
  children: React.ReactNode;
}) {
  const meta = channelMeta(channelKey);
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-white",
          meta.dot
        )}
      >
        <Icon name="eye" className="size-3" />
        Forhåndsvisning · {meta.label}
      </div>
      {children}
    </div>
  );
}
