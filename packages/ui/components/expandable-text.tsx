"use client";

import type * as React from "react";
import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "../icons";
import { cn } from "../lib/utils";

export interface ExpandableTextProps {
  children: React.ReactNode;
  /** Antall linjer som vises sammenfoldet. Default 3. */
  lines?: number;
  /** Etikett på knappen når teksten er sammenfoldet. */
  moreLabel?: string;
  /** Etikett når den er åpen. */
  lessLabel?: string;
  /** Klasser på selve teksten (typografi). */
  className?: string;
  /**
   * Klasser på knappen. Ligger kortet bak en strukket lenke
   * (`after:absolute after:inset-0`), må knappen ha `relative z-10` for å
   * være klikkbar.
   */
  buttonClassName?: string;
}

/**
 * Tekst som foldes sammen til et par linjer med en mjuk fade, og en «Vis
 * mer»-knapp som bare dukker opp når teksten faktisk er for lang. Korte
 * tekster ser helt urørte ut — ingen tom knapp, ingen fade.
 *
 * Måler seg selv etter render, så serveren sender alltid den sammenfoldede
 * varianten og lista hopper ikke etter hydrering.
 */
export function ExpandableText({
  children,
  lines = 3,
  moreLabel = "Vis mer",
  lessLabel = "Vis mindre",
  className,
  buttonClassName,
}: ExpandableTextProps) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const regionId = useId();
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const measure = () => {
      // Måles bare mens teksten er klippet — da er clientHeight lik
      // klippehøyden, og scrollHeight forteller hvor mye som mangler.
      if (expanded) return;
      setOverflows(el.scrollHeight > el.clientHeight + 1);
    };
    measure();
    // Teksten brytes om når kortet skifter bredde (mobil ↔ desktop, filter).
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [expanded]);

  const collapsed = !expanded;

  return (
    <>
      <p
        ref={textRef}
        id={regionId}
        style={collapsed ? { maxHeight: `${lines}lh` } : undefined}
        className={cn(
          className,
          collapsed && "overflow-hidden",
          // Fade bare når det faktisk er mer tekst under kanten — og bare over
          // den siste linja, ellers blir teksten man skal lese utvasket.
          collapsed &&
            overflows &&
            "[mask-image:linear-gradient(to_bottom,black_calc(100%_-_0.7lh),transparent)]"
        )}
      >
        {children}
      </p>
      {overflows && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          aria-controls={regionId}
          className={cn(
            "pressable mt-1 inline-flex w-fit items-center gap-1 font-heading font-semibold text-primary text-xs",
            buttonClassName
          )}
        >
          {expanded ? lessLabel : moreLabel}
          <Icon
            name="chevron-down"
            className={cn(
              "size-3.5 transition-transform duration-300",
              expanded && "rotate-180"
            )}
          />
        </button>
      )}
    </>
  );
}
