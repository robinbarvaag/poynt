"use client";

import { cn } from "../../lib/utils";
import { Reveal } from "../motion/reveal";

/**
 * Gjør en vanlig YouTube/Vimeo/Loom-lenke om til en embed-URL. Returnerer
 * `null` om vi ikke kjenner igjen formatet (kallstedet kan da vise en lenke).
 */
export function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    }
    if (host.endsWith("youtube.com")) {
      if (u.pathname.startsWith("/embed/")) return url;
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      if (u.pathname.startsWith("/shorts/")) {
        return `https://www.youtube.com/embed/${u.pathname.split("/")[2]}`;
      }
    }
    if (host.endsWith("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    if (host.endsWith("loom.com")) {
      return url.replace("/share/", "/embed/");
    }
    return null;
  } catch {
    return null;
  }
}

export interface VideoEmbedProps {
  url: string;
  caption?: string;
  title?: string;
  className?: string;
}

/**
 * Responsiv 16:9 video-embed i squircle-ramme. Faller tilbake til en lenke om
 * URL-en ikke kan gjøres om til embed.
 */
export function VideoEmbed({
  url,
  caption,
  title = "Video",
  className,
}: VideoEmbedProps) {
  const embed = toEmbedUrl(url);

  return (
    <Reveal className={cn("flex flex-col gap-3", className)}>
      {embed ? (
        <div className="relative aspect-video overflow-hidden rounded-2xl bg-foreground/5 ring-1 ring-foreground/10">
          <iframe
            src={embed}
            title={title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>
      ) : (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-2xl bg-muted/50 p-5 ring-1 ring-foreground/10 transition-colors hover:bg-muted"
        >
          <span aria-hidden="true" className="text-2xl">
            ▶︎
          </span>
          <span className="font-medium underline">{title}</span>
        </a>
      )}
      {caption && <p className="text-current/70 text-sm">{caption}</p>}
    </Reveal>
  );
}
