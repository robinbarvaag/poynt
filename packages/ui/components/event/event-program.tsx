import { cn } from "../../lib/utils";

export interface EventProgramItem {
  time?: string | null;
  title: string;
  description?: string | null;
}

export interface EventProgramProps {
  items: EventProgramItem[];
  className?: string;
}

/** Programmet som en loddrett tidslinje med klokkeslett til venstre. */
export function EventProgram({ items, className }: EventProgramProps) {
  if (!items.length) return null;

  return (
    <ol className={cn("relative space-y-6", className)}>
      <span
        aria-hidden="true"
        className="absolute top-2 bottom-2 left-[5.25rem] w-px bg-border"
      />
      {items.map((item, index) => (
        <li
          key={`${item.time ?? ""}-${item.title}`}
          className="relative grid grid-cols-[4.5rem_1fr] gap-6"
        >
          <span className="pt-0.5 text-right font-bold font-heading text-primary tabular-nums">
            {item.time}
          </span>
          <div className="relative">
            <span
              aria-hidden="true"
              className={cn(
                "-left-[1.72rem] absolute top-1.5 size-3 rounded-full ring-4 ring-background",
                index === 0 ? "bg-accent-1" : "bg-primary"
              )}
            />
            <p className="font-semibold text-foreground leading-snug">
              {item.title}
            </p>
            {item.description && (
              <p className="mt-1 text-muted-foreground text-sm leading-relaxed">
                {item.description}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
