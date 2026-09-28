"use client";

import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { ChevronDownIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "@poynt/ui/lib/utils";

/**
 * Accordion bygget på Base UI (ikke Radix) — av én grunn: `hiddenUntilFound`.
 * Lukkede paneler blir liggende i DOM-en med `hidden="until-found"`, så
 * svarene finnes i server-HTML-en (søkemotorer og AI-crawlere ser dem), og
 * Ctrl+F i nettleseren åpner panelet med treff. Radix monterer bare det
 * åpne panelet.
 *
 * API-et er holdt likt shadcn/Radix-varianten (`type="single" collapsible`,
 * `defaultValue="item-1"`) så eksisterende brukere ikke trenger endring.
 */

type RootPrimitiveProps = React.ComponentProps<typeof AccordionPrimitive.Root>;

export interface AccordionProps
  extends Omit<
    RootPrimitiveProps,
    "value" | "defaultValue" | "onValueChange" | "multiple"
  > {
  /** «single» = ett panel åpent om gangen (default), «multiple» = fritt. */
  type?: "single" | "multiple";
  /** Beholdt for kompatibilitet; Base UI lar alltid et åpent panel lukkes. */
  collapsible?: boolean;
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
}

const toArray = (value: string | string[] | undefined) =>
  value === undefined ? undefined : Array.isArray(value) ? value : [value];

function Accordion({
  type = "single",
  collapsible: _collapsible,
  value,
  defaultValue,
  onValueChange,
  hiddenUntilFound = true,
  ...props
}: AccordionProps) {
  const multiple = type === "multiple";
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      multiple={multiple}
      value={toArray(value)}
      defaultValue={toArray(defaultValue)}
      onValueChange={
        onValueChange
          ? (next: unknown[]) => {
              const values = next.map(String);
              onValueChange(multiple ? values : (values[0] ?? ""));
            }
          : undefined
      }
      hiddenUntilFound={hiddenUntilFound}
      {...props}
    />
  );
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b last:border-b-0", className)}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  indicator = "chevron",
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger> & {
  /** Åpne/lukke-markør. "plus" er den ikon-frie +/− for FAQ. */
  indicator?: "chevron" | "plus" | "none";
}) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-panel-open]>svg]:rotate-180 [&[data-panel-open]_.accordion-plus-v]:scale-y-0",
          className
        )}
        {...props}
      >
        {children}
        {indicator === "chevron" && (
          <ChevronDownIcon className="text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200" />
        )}
        {indicator === "plus" && (
          <span aria-hidden="true" className="relative mt-1 size-4 shrink-0">
            <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-current" />
            <span className="accordion-plus-v absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 rounded-full bg-current transition-transform duration-200" />
          </span>
        )}
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Panel>) {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      className="overflow-hidden text-sm data-closed:animate-accordion-up data-open:animate-accordion-down"
      {...props}
    >
      <div className={cn("pt-0 pb-4", className)}>{children}</div>
    </AccordionPrimitive.Panel>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
