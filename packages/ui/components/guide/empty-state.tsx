import type * as React from "react";
import { Icon, type IconName } from "../../icons";
import { cn } from "../../lib/utils";

export interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  /** En handling som hjelper brukeren videre — en tom skjerm er en invitasjon. */
  action?: React.ReactNode;
  className?: string;
}

/**
 * Tom-tilstand med retning, ikke stemning: si hva som mangler og hva man kan
 * gjøre. Brukes ved tomme søk, filtre uten treff, eller seksjoner uten innhold.
 */
export function EmptyState({
  icon = "compass",
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-3xl border border-foreground/10 border-dashed bg-foreground/[0.02] px-6 py-14 text-center",
        className
      )}
    >
      <span className="flex size-14 items-center justify-center rounded-2xl bg-mint/50 text-primary">
        <Icon name={icon} className="size-7" strokeWidth={1.5} />
      </span>
      <div className="flex max-w-sm flex-col gap-1.5">
        <h3 className="font-bold font-heading text-foreground text-lg tracking-tight">
          {title}
        </h3>
        {description && (
          <p className="text-muted-foreground text-sm leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
