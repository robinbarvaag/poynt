import type * as React from "react";
import { cn } from "../../lib/utils";
import { Card, CardSeparator } from "../card";

export type TestimonialSurface =
  | "default"
  | "saffron"
  | "salmon"
  | "mint"
  | "primary";

export interface TestimonialCardProps {
  /** Selve sitatet. Anførselstegn legges på automatisk. */
  quote: string;
  /** Navnet på personen bak sitatet. */
  author: string;
  /** Rolle/tittel, f.eks. "Daglig leder". */
  role?: string;
  /** Selskap/organisasjon. */
  company?: string;
  /**
   * Personbilde-slot — send f.eks. et `next/image` med
   * `fill className="object-cover"`. Uten bilde vises initialene.
   */
  avatar?: React.ReactNode;
  /**
   * Firmalogo-slot — vises øverst i kortet i stedet for sitatmerket.
   * Send f.eks. et `next/image` med `fill className="object-contain object-left"`.
   */
  logo?: React.ReactNode;
  /** Stjernevurdering 1–5. Utelates for et rent sitat uten rating. */
  rating?: number;
  /** Fargeblokk-tint. `default` er det lyse kortet. */
  surface?: TestimonialSurface;
  className?: string;
}

function QuoteGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-9", className)}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M9.5 5C6.46 5 4 7.46 4 10.5V19h7.5v-7.5H8c0-1.93 1.57-3.5 3.5-3.5V5Zm10 0C16.46 5 14 7.46 14 10.5V19h7.5v-7.5H18c0-1.93 1.57-3.5 3.5-3.5V5Z" />
    </svg>
  );
}

function StarRating({
  rating,
  emptyClassName,
}: {
  rating: number;
  emptyClassName: string;
}) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} av 5 stjerner`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          viewBox="0 0 24 24"
          className={cn(
            "size-4",
            star <= rating ? "fill-saffron text-saffron" : emptyClassName
          )}
          fill={star <= rating ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2Z" />
        </svg>
      ))}
    </div>
  );
}

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Anmeldelses-/kundehistorie-kort i en rolig, sitat-drevet stil. Deler
 * `Card`-flatene med de andre kort-sjangrene, men har sin egen «footer»:
 * et sitatmerke (eller firmalogo) øverst og personen — bilde + navn + rolle —
 * nederst. Presentasjons-only; appen kobler `next/image` inn via `avatar`/`logo`.
 */
export function TestimonialCard({
  quote,
  author,
  role,
  company,
  avatar,
  logo,
  rating,
  surface = "default",
  className,
}: TestimonialCardProps) {
  const tinted = surface !== "default";
  const mutedClass = tinted ? "text-current/70" : "text-muted-foreground";
  const emptyStarClass = tinted ? "text-current/30" : "text-foreground/15";
  const glyphClass = tinted ? "text-current/25" : "text-primary/20";

  return (
    <Card
      surface={surface}
      className={cn("h-full gap-0 p-6 md:p-8", className)}
    >
      <div className="flex items-start justify-between gap-4">
        {logo ? (
          <div className="relative h-9 w-28">{logo}</div>
        ) : (
          <QuoteGlyph className={glyphClass} />
        )}
        {rating != null && (
          <StarRating rating={rating} emptyClassName={emptyStarClass} />
        )}
      </div>

      <blockquote className="mt-6 flex-1 text-lg leading-relaxed">
        {quote}
      </blockquote>

      <CardSeparator className="my-6" />

      <div className="flex items-center gap-3">
        <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-current/10 font-heading font-semibold text-sm">
          {avatar ?? <span aria-hidden="true">{initialsOf(author)}</span>}
        </span>
        <div className="min-w-0">
          <div className="truncate font-semibold">{author}</div>
          {(role || company) && (
            <div className={cn("truncate text-sm", mutedClass)}>
              {role}
              {role && company && ", "}
              {company}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
