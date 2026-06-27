import type * as React from "react";
import { cn } from "../../lib/utils";

export interface StepBlockProps {
  /** Stegnummer som vises i merket. */
  number: number;
  title: string;
  /** Brødtekst, bilder (gjerne i `DeviceFrame`), callouts osv. */
  children?: React.ReactNode;
  /** Delsteg – en kort sjekkliste under steget. */
  substeps?: React.ReactNode[];
  className?: string;
}

/**
 * Ett steg i et steg-for-steg-kurs: nummerert merke, tittel, fritt innhold
 * (tekst + bilde i ramme) og en valgfri delsteg-sjekkliste. Bygd for å la
 * redaktøren laste opp et bilde per steg og bryte det ned i mindre delsteg.
 * En koblende linje binder stegene sammen visuelt.
 */
export function StepBlock({
  number,
  title,
  children,
  substeps,
  className,
}: StepBlockProps) {
  return (
    <div className={cn("group/step relative flex gap-4 md:gap-6", className)}>
      {/* Nummermerke + koblende linje til neste steg */}
      <div className="flex flex-col items-center">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary font-bold font-heading text-primary-foreground text-sm tabular-nums">
          {String(number).padStart(2, "0")}
        </span>
        <span
          aria-hidden="true"
          className="mt-2 w-px flex-1 bg-foreground/10 group-last/step:hidden"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-4 pb-10">
        <h3 className="font-bold font-heading text-foreground text-xl leading-snug tracking-tight">
          {title}
        </h3>

        {children && (
          <div className="flex flex-col gap-4 text-foreground/80 leading-relaxed">
            {children}
          </div>
        )}

        {substeps && substeps.length > 0 && (
          <ol className="flex flex-col gap-2">
            {substeps.map((step, i) => (
              <li
                // biome-ignore lint/suspicious/noArrayIndexKey: statiske delsteg
                key={i}
                className="flex items-start gap-3 rounded-2xl bg-foreground/[0.03] px-4 py-3 ring-1 ring-foreground/10"
              >
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 font-heading font-semibold text-[0.7rem] text-primary tabular-nums">
                  {i + 1}
                </span>
                <span className="text-foreground/80 text-sm leading-relaxed">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
