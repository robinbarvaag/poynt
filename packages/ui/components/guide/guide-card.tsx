import type * as React from "react";
import { UILink } from "../../lib/link";
import { cn } from "../../lib/utils";
import { Card } from "../card";

export type GuideCardSurface =
  | "default"
  | "saffron"
  | "salmon"
  | "mint"
  | "primary"
  | "ink";

export interface GuideCardProps {
  href: string;
  title: string;
  lede?: string;
  /** Emoji-ikon vist i en liten «chip». */
  icon?: string;
  /** Kategori/kanal-ledetekst. */
  category?: string;
  /** Aksent-strek-farge (hex fra kategori). Faller tilbake til currentColor. */
  accentColor?: string;
  /** Valgfritt miniatyrbilde (typisk et <Image>). */
  thumbnail?: React.ReactNode;
  surface?: GuideCardSurface;
  className?: string;
}

/**
 * Kort til ressurs-hub-en. Klikkbart hele kortet, lite løft på hover. Brukes
 * inni en `Stagger` for å gli inn radvis. Følger samme fargeblokk-språk som
 * `BlogCard`/`Card`.
 */
export function GuideCard({
  href,
  title,
  lede,
  icon,
  category,
  accentColor,
  thumbnail,
  surface = "default",
  className,
}: GuideCardProps) {
  return (
    <Card
      asChild
      surface={surface}
      className={cn(
        "group/guide h-full gap-0 overflow-hidden p-0 transition-transform duration-300 hover:-translate-y-1.5",
        className
      )}
    >
      <UILink href={href}>
        {thumbnail && (
          <div className="relative aspect-[16/9] overflow-hidden bg-background/40 *:[img]:h-full *:[img]:w-full *:[img]:object-cover *:[img]:transition-transform *:[img]:duration-500 group-hover/guide:*:[img]:scale-105">
            {thumbnail}
          </div>
        )}
        <div className="flex h-full flex-col gap-3 px-6 pt-5 pb-6">
          <div className="flex items-center gap-2">
            {icon && (
              <span
                aria-hidden="true"
                className="inline-flex size-9 items-center justify-center rounded-xl bg-background/70 text-xl ring-1 ring-current/10"
              >
                {icon}
              </span>
            )}
            {category && (
              <span
                className="font-heading font-semibold text-xs uppercase tracking-[0.16em]"
                style={accentColor ? { color: accentColor } : undefined}
              >
                {category}
              </span>
            )}
          </div>

          <h3 className="font-bold font-heading text-xl leading-snug tracking-tight">
            {title}
          </h3>

          {lede && (
            <p className="line-clamp-3 text-current/75 leading-relaxed">
              {lede}
            </p>
          )}

          <span
            aria-hidden="true"
            className="mt-auto inline-flex items-center gap-1 pt-2 font-medium text-sm opacity-70 transition-opacity group-hover/guide:opacity-100"
          >
            Les guide
            <span className="transition-transform duration-300 group-hover/guide:translate-x-1">
              →
            </span>
          </span>
        </div>
      </UILink>
    </Card>
  );
}
