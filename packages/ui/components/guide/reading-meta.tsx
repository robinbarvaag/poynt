import { Icon, type IconName } from "../../icons";
import { cn } from "../../lib/utils";

export interface ReadingMetaItem {
  /** Ikonnavn fra design-systemets ikonsett (lucide-basert, byttbart). */
  icon?: IconName;
  label: string;
}

export interface ReadingMetaProps {
  items: ReadingMetaItem[];
  className?: string;
}

/**
 * Rad med «chips» som rammer inn lese-konteksten: tid, nivå, format, sist
 * oppdatert. Bruker design-systemets `Icon` (ikke emoji) så det holder seg proft
 * og konsistent — emoji hører hjemme i redaksjonelt innhold, ikke i strukturen.
 */
export function ReadingMeta({ items, className }: ReadingMetaProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2.5", className)}>
      {items.map((item) => (
        <span
          key={item.label}
          className="inline-flex items-center gap-2 rounded-full bg-background/80 px-4 py-2 font-medium text-foreground/80 text-sm ring-1 ring-foreground/10 backdrop-blur"
        >
          {item.icon && (
            <Icon name={item.icon} className="size-4 text-primary" />
          )}
          {item.label}
        </span>
      ))}
    </div>
  );
}
