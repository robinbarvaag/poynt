"use client";

import { useEffect, useState } from "react";
import { Icon } from "../../icons";
import { cn } from "../../lib/utils";

export interface SectionRailItem {
  /** Må matche `id` på tilhørende seksjon i innholdet. */
  id: string;
  label: string;
}

export interface SectionRailProps {
  items: SectionRailItem[];
  /** Liten overskrift over lista. */
  title?: string;
  className?: string;
}

/**
 * Sticky, nummerert seksjons-stepper for lesemodus. Erstatter den trange
 * innholdsfortegnelsen: nummerering er meningsbærende her — en how-to *er* en
 * sekvens. Følger aktiv seksjon med IntersectionObserver, og markerer passerte
 * steg med ✓ slik at det kobles til «hvor langt har jeg kommet».
 */
export function SectionRail({
  items,
  title = "I denne guiden",
  className,
}: SectionRailProps) {
  const [activeId, setActiveId] = useState<string | undefined>(items[0]?.id);

  useEffect(() => {
    if (items.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: "-15% 0px -75% 0px", threshold: 0 }
    );
    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  const activeIndex = Math.max(
    0,
    items.findIndex((i) => i.id === activeId)
  );

  return (
    <nav className={cn("flex flex-col", className)} aria-label={title}>
      <span className="mb-3 px-2.5 font-heading font-semibold text-muted-foreground text-xs uppercase tracking-[0.18em]">
        {title}
      </span>
      <ol className="flex flex-col gap-0.5">
        {items.map((item, index) => {
          const isActive = index === activeIndex;
          const isDone = index < activeIndex;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl px-2.5 py-2 transition-colors",
                  isActive ? "bg-primary/10" : "hover:bg-foreground/5"
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full font-heading font-semibold text-[0.7rem] ring-1 transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground ring-primary"
                      : isDone
                        ? "bg-mint text-foreground ring-transparent"
                        : "bg-background text-muted-foreground ring-foreground/15"
                  )}
                >
                  {isDone ? (
                    <Icon name="check" className="size-3.5" />
                  ) : (
                    String(index + 1).padStart(2, "0")
                  )}
                </span>
                <span
                  className={cn(
                    "text-sm leading-snug transition-colors",
                    isActive
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  {item.label}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
