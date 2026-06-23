"use client";

import type * as React from "react";
import { cn } from "../../lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../accordion";

export interface GuideToggleItem {
  title: string;
  /** Ferdig-rendret innhold. Kan være tomt (Notion-toggles var kollapset). */
  content?: React.ReactNode;
}

export interface GuideToggleProps {
  items: GuideToggleItem[];
  className?: string;
}

/**
 * Sammenleggbare seksjoner bygget på `Accordion` med plus-markør. Tomme punkter
 * viser en diskret «fyll inn»-hint (innhold manglet i Notion-kilden).
 */
export function GuideToggle({ items, className }: GuideToggleProps) {
  return (
    <Accordion
      type="single"
      collapsible
      className={cn(
        "rounded-2xl bg-muted/30 px-5 ring-1 ring-foreground/10",
        className
      )}
    >
      {items.map((item, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: statisk toggle-liste uten stabil id
        <AccordionItem key={i} value={`item-${i}`}>
          <AccordionTrigger indicator="plus" className="font-heading text-base">
            {item.title}
          </AccordionTrigger>
          <AccordionContent className="text-current/80 leading-relaxed [&_a]:underline [&_p+p]:mt-3 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5">
            {item.content ?? (
              <span className="text-current/50 italic">
                Innhold kommer snart.
              </span>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
