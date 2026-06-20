import type * as React from "react";
import { cn } from "../../lib/utils";
import { Card } from "../card";

export type BlogSurface =
  | "default"
  | "saffron"
  | "salmon"
  | "mint"
  | "primary"
  | "ink";

export interface BlogCardProps {
  href: string;
  title: string;
  excerpt?: string;
  /** Kategori-ledetekst (vises som aksent-eyebrow). */
  category?: string;
  /** Ferdig formatert dato, f.eks. "3. juni 2026". */
  date?: string;
  /** Forfatternavn (vises i bunnlinja). */
  authorName?: string;
  /** Avatar-slot, f.eks. en `<Avatar>` eller `next/image`. */
  authorAvatar?: React.ReactNode;
  /** Hovedbilde-slot. Uten bilde blir kortet et rent typografisk fargeblokk-kort. */
  image?: React.ReactNode;
  /** Fargeblokk-tint. `BlogGrid` roterer disse automatisk. */
  surface?: BlogSurface;
  /** Stort, fremhevet innlegg som spenner 2 kolonner. */
  featured?: boolean;
  className?: string;
}

// Høy-kontrast aksent for kategori-eyebrow, valgt mot surface.
const accentBySurface: Record<BlogSurface, string> = {
  default: "text-primary",
  saffron: "text-primary",
  salmon: "text-primary",
  mint: "text-primary",
  primary: "text-saffron",
  ink: "text-saffron",
};

function Eyebrow({
  surface,
  children,
}: { surface: BlogSurface; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "font-heading font-semibold text-xs uppercase tracking-[0.18em]",
        accentBySurface[surface]
      )}
    >
      {children}
    </span>
  );
}

function Meta({
  authorName,
  authorAvatar,
  date,
}: Pick<BlogCardProps, "authorName" | "authorAvatar" | "date">) {
  if (!(authorName || date)) {
    return null;
  }
  return (
    <div className="mt-auto flex items-center gap-2 pt-5 text-current/70 text-sm">
      {authorAvatar}
      {authorName && (
        <span className="font-medium text-current">{authorName}</span>
      )}
      {authorName && date && (
        <span aria-hidden="true" className="opacity-50">
          ·
        </span>
      )}
      {date && <span>{date}</span>}
    </div>
  );
}

export function BlogCard({
  href,
  title,
  excerpt,
  category,
  date,
  authorName,
  authorAvatar,
  image,
  surface = "default",
  featured = false,
  className,
}: BlogCardProps) {
  const content = (
    <div
      className={cn(
        "flex h-full flex-col gap-3 px-6 pb-6",
        image ? "pt-4" : "pt-6",
        featured && "md:justify-center md:px-8 md:py-10"
      )}
    >
      {category && <Eyebrow surface={surface}>{category}</Eyebrow>}

      <h3
        className={cn(
          "font-bold font-heading tracking-tight transition-colors",
          featured
            ? "text-2xl leading-tight md:text-4xl"
            : image
              ? "line-clamp-3 text-xl leading-snug"
              : "line-clamp-4 text-2xl leading-tight"
        )}
      >
        {title}
      </h3>

      {excerpt && (
        <p
          className={cn(
            "text-current/75 leading-relaxed",
            featured ? "line-clamp-3 md:text-lg" : "line-clamp-3",
            !image && !featured && "line-clamp-5"
          )}
        >
          {excerpt}
        </p>
      )}

      <Meta authorName={authorName} authorAvatar={authorAvatar} date={date} />
    </div>
  );

  return (
    <Card
      asChild
      surface={surface}
      className={cn(
        "group/post gap-0 overflow-hidden p-0 transition-transform duration-300 hover:-translate-y-1.5",
        featured && "sm:col-span-2",
        className
      )}
    >
      <a href={href}>
        {image ? (
          <div
            className={cn(
              featured && "md:grid md:h-full md:grid-cols-2 md:items-stretch"
            )}
          >
            <div className={cn("p-3", featured && "md:h-full")}>
              <div
                className={cn(
                  "relative overflow-hidden rounded-2xl bg-background/40",
                  featured
                    ? "aspect-video md:aspect-auto md:h-full md:min-h-72"
                    : "aspect-video"
                )}
              >
                {image}
              </div>
            </div>
            {content}
          </div>
        ) : (
          content
        )}
      </a>
    </Card>
  );
}
