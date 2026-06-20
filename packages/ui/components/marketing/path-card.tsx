import type * as React from "react";
import { cn } from "../../lib/utils";
import { Card } from "../card";

export type PathSurface = "default" | "saffron" | "salmon" | "mint" | "primary";

export interface PathCardProps {
  /** Hele kortet er én stor klikkbar lenke. */
  href: string;
  /** Liten ledetekst over tittelen, f.eks. "For deg som". */
  eyebrow?: string;
  title: string;
  description?: string;
  /** Korte punkter som beskriver hva veien inneholder. */
  items?: string[];
  /** Tekst på handlingslenken nederst. Default "Utforsk". */
  ctaLabel?: string;
  /** Valgfritt ikon-slot øverst (f.eks. en lucide-ikon-node). */
  icon?: React.ReactNode;
  /** Fargeblokk-tint. `default` er det lyse kortet. */
  surface?: PathSurface;
  className?: string;
}

function ArrowRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function Check() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="mt-0.5 size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/**
 * Stort, fullt klikkbart «vei»-kort — byggeklossen i en «to dører»-seksjon der
 * den besøkende velger sin vei (f.eks. «Jeg er gründer» / «Vi er en bedrift»).
 * Bygd på `Card` (surface + asChild). Presentasjons-only.
 */
export function PathCard({
  href,
  eyebrow,
  title,
  description,
  items,
  ctaLabel = "Utforsk",
  icon,
  surface = "default",
  className,
}: PathCardProps) {
  const tinted = surface !== "default";
  const mutedClass = tinted ? "text-current/75" : "text-muted-foreground";
  const accentClass = tinted ? "text-current" : "text-primary";

  return (
    <Card
      asChild
      surface={surface}
      className={cn(
        "group/path h-full gap-0 p-8 transition-transform duration-300 hover:-translate-y-1.5 md:p-10",
        className
      )}
    >
      <a href={href}>
        {(icon || eyebrow) && (
          <div className="mb-6 flex items-center gap-3">
            {icon && (
              <span
                className={cn(
                  "flex size-11 items-center justify-center rounded-full bg-current/10",
                  accentClass
                )}
              >
                {icon}
              </span>
            )}
            {eyebrow && (
              <span
                className={cn(
                  "font-heading font-semibold text-sm uppercase tracking-[0.18em]",
                  accentClass
                )}
              >
                {eyebrow}
              </span>
            )}
          </div>
        )}

        <h3 className="font-bold font-heading text-3xl leading-tight tracking-tight md:text-4xl">
          {title}
        </h3>

        {description && (
          <p className={cn("mt-4 text-base leading-relaxed", mutedClass)}>
            {description}
          </p>
        )}

        {items && items.length > 0 && (
          <ul className="mt-6 flex flex-col gap-3">
            {items.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm">
                <span className={accentClass}>
                  <Check />
                </span>
                <span className={mutedClass}>{item}</span>
              </li>
            ))}
          </ul>
        )}

        <span
          className={cn(
            "mt-8 inline-flex items-center gap-2 pt-2 font-bold text-sm transition-all group-hover/path:gap-3.5",
            accentClass
          )}
        >
          {ctaLabel}
          <ArrowRight />
        </span>
      </a>
    </Card>
  );
}
