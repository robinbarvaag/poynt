"use client";

import { Icon, type IconName } from "../../icons";
import { cn } from "../../lib/utils";

export type LessonType = "video" | "pdf" | "tekst" | "steg";

const typeIcon: Record<LessonType, IconName> = {
  video: "play",
  pdf: "file-text",
  tekst: "file-text",
  steg: "layout-list",
};

export interface LessonItem {
  id: string;
  title: string;
  type?: LessonType;
  /** F.eks. «6 min» eller «4 steg». */
  meta?: string;
  completed?: boolean;
}

export interface LessonListProps {
  items: LessonItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
  title?: string;
  className?: string;
}

/**
 * Kapittel-/leksjonsliste for kurs. Viser type (video/PDF/tekst/steg), varighet
 * og fullført-status, med en samlet fremdrift øverst. Fungerer for både enkle
 * opptaks-kurs og fleksible steg-for-steg-løp.
 */
export function LessonList({
  items,
  activeId,
  onSelect,
  title = "Innhold i kurset",
  className,
}: LessonListProps) {
  const done = items.filter((i) => i.completed).length;
  const pct = items.length > 0 ? (done / items.length) * 100 : 0;

  return (
    <nav className={cn("flex flex-col gap-4", className)} aria-label={title}>
      <div className="flex flex-col gap-2 px-1">
        <span className="font-heading font-semibold text-muted-foreground text-xs uppercase tracking-[0.18em]">
          {title}
        </span>
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/10">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="font-medium text-muted-foreground text-xs tabular-nums">
            {done}/{items.length}
          </span>
        </div>
      </div>

      <ol className="flex flex-col gap-0.5">
        {items.map((item, index) => {
          const isActive = item.id === activeId;
          const icon = typeIcon[item.type ?? "tekst"];
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect?.(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl px-2.5 py-2.5 text-left transition-colors",
                  isActive ? "bg-primary/10" : "hover:bg-foreground/5"
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full ring-1 transition-colors",
                    item.completed
                      ? "bg-mint text-foreground ring-transparent"
                      : isActive
                        ? "bg-primary text-primary-foreground ring-primary"
                        : "bg-background text-muted-foreground ring-foreground/15"
                  )}
                >
                  {item.completed ? (
                    <Icon name="check" className="size-4" />
                  ) : (
                    <Icon name={icon} className="size-4" />
                  )}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span
                    className={cn(
                      "truncate text-sm leading-snug",
                      isActive
                        ? "font-semibold text-foreground"
                        : "text-foreground/80"
                    )}
                  >
                    {item.title}
                  </span>
                  {item.meta && (
                    <span className="text-muted-foreground text-xs">
                      {item.meta}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
