import type * as React from "react";
import { cn } from "../../lib/utils";

export interface RelatedContentProps {
  title?: string;
  description?: string;
  columns?: 2 | 3;
  /** ContentCard-elementer. */
  children: React.ReactNode;
  className?: string;
}

const colClass: Record<2 | 3, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
};

/**
 * «Les videre»-seksjon under artikler, guider og kurs. Gjenbruker ContentCard,
 * så relatert innhold ser likt ut overalt.
 */
export function RelatedContent({
  title = "Les videre",
  description,
  columns = 3,
  children,
  className,
}: RelatedContentProps) {
  return (
    <section
      className={cn(
        "flex flex-col gap-5 border-foreground/10 border-t pt-10",
        className
      )}
    >
      <div className="flex flex-col gap-0.5">
        <h2 className="font-bold font-heading text-2xl tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </div>
      <div className={cn("grid grid-cols-1 gap-6", colClass[columns])}>
        {children}
      </div>
    </section>
  );
}
