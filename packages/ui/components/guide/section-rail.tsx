"use client";

import { useEffect, useState } from "react";
import { Icon } from "../../icons";
import { cn } from "../../lib/utils";

export interface SectionRailItem {
  /** Må matche `id` på tilhørende seksjon i innholdet. */
  id: string;
  label: string;
  /** H2 = nummerert hovedsteg, H3 = innrykket underpunkt. Default 2. */
  level?: 2 | 3;
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
    // Posisjonsbasert scroll-spy: aktiv seksjon = den siste overskriften hvis
    // topp er over en linje nær toppen. Mer robust enn et IntersectionObserver-
    // bånd, som bommer når man klikker og hopper rett til en seksjon.
    const onScroll = () => {
      const offset = 140;
      let current = items[0]?.id;
      for (const item of items) {
        const el = document.getElementById(item.id);
        if (el && el.getBoundingClientRect().top - offset <= 0) {
          current = item.id;
        }
      }
      setActiveId(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [items]);

  const activeIndex = Math.max(
    0,
    items.findIndex((i) => i.id === activeId)
  );

  let step = 0;

  return (
    <nav className={cn("flex flex-col", className)} aria-label={title}>
      <span className="mb-3 px-2.5 font-heading font-semibold text-muted-foreground text-xs uppercase tracking-[0.18em]">
        {title}
      </span>
      <ol className="flex flex-col gap-0.5">
        {items.map((item, index) => {
          const isActive = index === activeIndex;
          const isDone = index < activeIndex;
          const isSub = (item.level ?? 2) === 3;
          if (!isSub) step += 1;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl transition-colors",
                  isSub ? "py-1.5 pr-2.5 pl-11" : "px-2.5 py-2",
                  isActive ? "bg-primary/10" : "hover:bg-foreground/5"
                )}
              >
                {isSub ? (
                  <span
                    className={cn(
                      "size-1.5 shrink-0 rounded-full transition-colors",
                      isActive
                        ? "bg-primary"
                        : isDone
                          ? "bg-mint"
                          : "bg-foreground/25"
                    )}
                  />
                ) : (
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
                      String(step).padStart(2, "0")
                    )}
                  </span>
                )}
                <span
                  className={cn(
                    "leading-snug transition-colors",
                    isSub ? "text-[0.8rem]" : "text-sm",
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
