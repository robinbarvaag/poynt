import type * as React from "react";
import { cn } from "../../lib/utils";

export interface ContentRailProps {
  title: string;
  description?: string;
  /** Valgfri handling til høyre, typisk en «Se alle»-lenke. */
  action?: React.ReactNode;
  /** ContentCard-elementer. Får fast bredde og snap i rail-en. */
  children: React.ReactNode;
  className?: string;
}

/**
 * Horisontal «magasin-rail» for innhold. Kortene får fast bredde og scroll-snap,
 * så man blar bortover (særlig naturlig på mobil) i stedet for et tungt rutenett.
 * Bruk for kuraterte striper som «Kom i gang» eller «Mest lest».
 */
export function ContentRail({
  title,
  description,
  action,
  children,
  className,
}: ContentRailProps) {
  return (
    <section className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-bold font-heading text-2xl tracking-tight">
            {title}
          </h2>
          {description && (
            <p className="text-muted-foreground text-sm">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      <div
        className={cn(
          "-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "[&>*]:w-[78%] [&>*]:shrink-0 [&>*]:snap-start sm:[&>*]:w-[300px]"
        )}
      >
        {children}
      </div>
    </section>
  );
}
