import type * as React from "react";
import { Icon } from "../../icons";
import { UILink } from "../../lib/link";
import { cn } from "../../lib/utils";
import {
  CONTENT_FORMATS,
  type ContentFormat,
  type ContentMetaItem,
} from "./content-card";

export type ContentFeatureSurface = "default" | "mint" | "saffron" | "salmon";

const surfaceClasses: Record<ContentFeatureSurface, string> = {
  default: "bg-card",
  mint: "bg-accent-3/40",
  saffron: "bg-accent-1/35",
  salmon: "bg-accent-2/35",
};

export interface ContentFeatureProps {
  href: string;
  format: ContentFormat;
  /** Liten ledetekst over tittelen, f.eks. «Redaksjonens valg». */
  eyebrow?: string;
  title: string;
  lede?: string;
  cover?: React.ReactNode;
  meta?: ContentMetaItem[];
  surface?: ContentFeatureSurface;
  className?: string;
}

/**
 * Stort, redaksjonelt «utvalgt»-felt til toppen av innholds-huben. To-delt: cover
 * på den ene siden, selvsikker tittel + ingress på den andre. Bruk én om gangen —
 * dette er forsidesaken som skal trekke folk inn.
 */
export function ContentFeature({
  href,
  format,
  eyebrow = "Plukket ut nå",
  title,
  lede,
  cover,
  meta,
  surface = "mint",
  className,
}: ContentFeatureProps) {
  const config = CONTENT_FORMATS[format];

  return (
    <UILink
      href={href}
      className={cn(
        "group/feature grid overflow-hidden rounded-[2rem] ring-1 ring-foreground/10 transition-shadow duration-300 hover:shadow-[0_30px_70px_-35px_rgba(0,64,41,0.45)] md:grid-cols-2",
        surfaceClasses[surface],
        className
      )}
    >
      <div className="relative aspect-[16/11] overflow-hidden md:aspect-auto">
        {cover ? (
          <div className="absolute inset-0 *:[img]:h-full *:[img]:w-full *:[img]:object-cover *:[img]:transition-transform *:[img]:duration-500 group-hover/feature:*:[img]:scale-105">
            {cover}
          </div>
        ) : (
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center",
              config.fallback
            )}
          >
            <Icon
              name={config.icon}
              className="size-20 text-foreground/15"
              strokeWidth={1.5}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 p-7 md:p-9">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1 font-heading font-semibold text-foreground text-xs ring-1 ring-foreground/10">
            <Icon name={config.icon} className="size-3.5 text-primary" />
            {config.label}
          </span>
          {eyebrow && (
            <span className="font-heading font-semibold text-muted-foreground text-xs uppercase tracking-[0.16em]">
              {eyebrow}
            </span>
          )}
        </div>

        <h2 className="text-balance font-bold font-heading text-3xl leading-[1.1] tracking-tight md:text-[2.5rem]">
          {title}
        </h2>

        {lede && (
          <p className="text-base text-foreground/75 leading-relaxed md:text-lg">
            {lede}
          </p>
        )}

        {meta && meta.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-foreground/60 text-sm">
            {meta.map((item) => (
              <span
                key={item.label}
                className="inline-flex items-center gap-1.5"
              >
                {item.icon && <Icon name={item.icon} className="size-4" />}
                {item.label}
              </span>
            ))}
          </div>
        )}

        <span className="mt-1 inline-flex items-center gap-1.5 font-heading font-semibold text-primary">
          Les nå
          <Icon
            name="arrow-right"
            className="size-4 transition-transform duration-300 group-hover/feature:translate-x-1"
          />
        </span>
      </div>
    </UILink>
  );
}
