import { cn } from "../../lib/utils";

export interface MarqueeProps {
  /** Ordene som ruller. Gjentas til båndet er fullt. */
  items: string[];
  /** Tempo. Default "base" (~34s per runde). */
  speed?: "slow" | "base" | "fast";
  /** Rull mot høyre i stedet for venstre. */
  reverse?: boolean;
  surface?: "primary" | "saffron" | "salmon" | "mint" | "outline";
  /** Liten skjevstilling — gir båndet et plakat-preg. Default true. */
  tilt?: boolean;
  className?: string;
}

const speeds = { slow: "52s", base: "34s", fast: "20s" } as const;

const surfaces = {
  primary: "bg-primary text-primary-foreground",
  saffron: "bg-accent-1 text-foreground",
  salmon: "bg-accent-2 text-foreground",
  mint: "bg-accent-3 text-foreground",
  outline: "border-border border-y bg-background text-foreground",
} as const;

/**
 * Uendelig tekstbånd i full bredde. Sporet inneholder lista to ganger og
 * forskyves nøyaktig 50 % — da lander løkka der den startet, uten hopp.
 * Ren CSS (kjører utenfor hovedtråden) og lineær fart: et bånd som
 * akselererer og bremser ser ødelagt ut. Står stille ved redusert bevegelse
 * og pauser når pekeren hviler på det, så teksten kan leses.
 */
export function Marquee({
  items,
  speed = "base",
  reverse = false,
  surface = "primary",
  tilt = true,
  className,
}: MarqueeProps) {
  if (items.length === 0) return null;

  // Én halvdel av sporet. Avstanden ligger som padding INNE i hvert ord (ikke
  // som gap mellom halvdelene), så de to halvdelene er nøyaktig like brede —
  // ellers treffer ikke -50 % nøyaktig, og løkka hopper for hver runde.
  const half = (
    <div className="flex shrink-0 items-center">
      {items.map((item) => (
        <span
          key={item}
          className="flex shrink-0 items-center gap-8 pr-8 font-heading font-semibold text-xl tracking-tight md:text-2xl"
        >
          {item}
          <span className="size-1.5 shrink-0 rounded-full bg-current opacity-50" />
        </span>
      ))}
    </div>
  );

  return (
    <div
      className={cn(
        "group relative w-full overflow-hidden py-4",
        surfaces[surface],
        tilt && "-rotate-[1.2deg] scale-[1.03]",
        className
      )}
      aria-hidden="true"
    >
      <div
        className={cn(
          "flex w-max min-w-full shrink-0 items-center group-hover:[animation-play-state:paused]",
          reverse ? "animate-marquee-reverse" : "animate-marquee"
        )}
        style={{ "--marquee-duration": speeds[speed] } as React.CSSProperties}
      >
        {half}
        {half}
      </div>
    </div>
  );
}
