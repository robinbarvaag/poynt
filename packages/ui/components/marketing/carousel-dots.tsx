import { cn } from "../../lib/utils";

export interface CarouselDotsProps {
  count: number;
  selectedIndex: number;
  onSelect: (index: number) => void;
  className?: string;
}

/**
 * Felles prikknavigasjon for sveipbare rader (karusell, coverflow, produktrad,
 * sitatrad).
 *
 * Prikken er 12 px, men selve knappen er minst 24×24 px (WCAG 2.5.8) —
 * den synlige prikken er en `span` inni. Uten dette bommer man lett på
 * nabo-prikken på mobil, og Lighthouse flagger trykkflatene som for små.
 * `px-1.5` gir samme luft rundt den brede aktive streken som mellom de runde
 * prikkene. Inaktive prikker på /55 gir akkurat 3:1 mot bakgrunnen (1.4.11).
 */
export function CarouselDots({
  count,
  selectedIndex,
  onSelect,
  className,
}: CarouselDotsProps) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      {Array.from({ length: count }, (_, index) => (
        <button
          // biome-ignore lint/suspicious/noArrayIndexKey: prikkene ER indekser
          key={index}
          type="button"
          onClick={() => onSelect(index)}
          aria-label={`Gå til ${index + 1}`}
          aria-current={index === selectedIndex}
          className="group flex h-6 min-w-6 items-center justify-center px-1.5"
        >
          <span
            className={cn(
              "h-3 rounded-full transition-all duration-300 ease-out",
              index === selectedIndex
                ? "w-10 bg-primary"
                : "w-3 bg-foreground/55 group-hover:bg-foreground/80"
            )}
          />
        </button>
      ))}
    </div>
  );
}
