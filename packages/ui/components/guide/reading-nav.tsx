"use client";

import { useEffect, useState } from "react";
import { Icon } from "../../icons";
import { cn } from "../../lib/utils";
import type { SectionRailItem } from "./section-rail";

export interface ReadingNavProps {
  items: SectionRailItem[];
  /** Etikett over gjeldende del. */
  partLabel?: (current: number, total: number) => string;
  className?: string;
}

/**
 * Mobil-variant av `SectionRail`: en sticky topplinje som viser hvilken del du
 * er i, en fremdriftsstrek, og en knapp som folder ut alle delene så du kan
 * hoppe. Skjult på desktop (der `SectionRail` overtar). Holder navigasjonen
 * innen rekkevidde for de mange som leser på telefon.
 */
export function ReadingNav({ items, partLabel, className }: ReadingNavProps) {
  const [activeId, setActiveId] = useState<string | undefined>(items[0]?.id);
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (items.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: "-10% 0px -80% 0px", threshold: 0 }
    );
    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  useEffect(() => {
    const update = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setProgress(max > 0 ? Math.min(100, (el.scrollTop / max) * 100) : 0);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const activeIndex = Math.max(
    0,
    items.findIndex((i) => i.id === activeId)
  );
  const current = items[activeIndex];
  const label = partLabel
    ? partLabel(activeIndex + 1, items.length)
    : `Del ${activeIndex + 1} av ${items.length}`;

  return (
    <div className={cn("sticky top-0 z-40 lg:hidden", className)}>
      <div className="border-foreground/10 border-b bg-background/85 backdrop-blur">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-3 px-4 py-3 text-left"
          aria-expanded={open}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-heading font-semibold text-[0.7rem] text-primary-foreground">
            {String(activeIndex + 1).padStart(2, "0")}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="font-heading text-[0.65rem] text-muted-foreground uppercase tracking-[0.16em]">
              {label}
            </span>
            <span className="truncate font-semibold text-foreground text-sm">
              {current?.label}
            </span>
          </span>
          <Icon
            name="chevrons-up-down"
            className="size-4 shrink-0 text-muted-foreground"
          />
        </button>
        <div className="h-0.5 bg-foreground/5">
          <div
            className="h-full bg-primary transition-[width] duration-150 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {open && (
        <div className="absolute inset-x-0 top-full border-foreground/10 border-b bg-background shadow-[0_20px_40px_-20px_rgba(0,64,41,0.35)]">
          <ol className="flex flex-col p-2">
            {items.map((item, index) => {
              const isActive = index === activeIndex;
              const isDone = index < activeIndex;
              return (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-3 py-2.5",
                      isActive ? "bg-primary/10" : "active:bg-foreground/5"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full font-heading font-semibold text-[0.65rem]",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : isDone
                            ? "bg-mint text-foreground"
                            : "bg-foreground/5 text-muted-foreground"
                      )}
                    >
                      {isDone ? (
                        <Icon name="check" className="size-3" />
                      ) : (
                        String(index + 1).padStart(2, "0")
                      )}
                    </span>
                    <span
                      className={cn(
                        "text-sm",
                        isActive
                          ? "font-semibold text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {item.label}
                    </span>
                  </a>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
