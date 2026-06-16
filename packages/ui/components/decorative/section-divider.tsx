import { cn } from "../../lib/utils";

type DividerShape = "wave" | "curve" | "slant" | "peak";
type DividerColor =
  | "primary"
  | "accent"
  | "salmon"
  | "saffron"
  | "mint"
  | "muted"
  | "secondary"
  | "background";

interface SectionDividerProps {
  /** Formen på overgangen. */
  shape?: DividerShape;
  /** Fyllfarge — sett til fargen på seksjonen overgangen kommer FRA. */
  color?: DividerColor;
  /** Speil vertikalt (for bunn-overganger). */
  flip?: boolean;
  className?: string;
}

// Paths fyller den øvre fargede delen og former den nedre kanten.
const paths: Record<DividerShape, string> = {
  wave: "M0,0V42c47.8,22.2,103.6,32.2,158,28C386,64,420,18,600,18s214,46,442,52c54.4,4.2,110.2-5.8,158-28V0Z",
  curve: "M0,0V30C400,92,800,92,1200,30V0Z",
  slant: "M0,0V70L1200,0Z",
  peak: "M0,0H1200V36L600,80L0,36Z",
};

const fillMap: Record<DividerColor, string> = {
  primary: "fill-primary",
  accent: "fill-accent",
  salmon: "fill-salmon",
  saffron: "fill-saffron",
  mint: "fill-mint",
  muted: "fill-muted",
  secondary: "fill-secondary",
  background: "fill-background",
};

/**
 * Formet overgang mellom to fargeseksjoner (wave/curve/slant/peak). Plasser
 * øverst i en seksjon med `color` lik den FORRIGE seksjonens farge.
 */
export function SectionDivider({
  shape = "wave",
  color = "muted",
  flip = false,
  className,
}: SectionDividerProps) {
  return (
    <div
      className={cn(
        "-mb-px w-full overflow-hidden leading-[0]",
        flip && "rotate-180",
        className
      )}
    >
      <svg
        viewBox="0 0 1200 80"
        preserveAspectRatio="none"
        className={cn("h-[50px] w-full md:h-[70px]", fillMap[color])}
        aria-hidden="true"
        focusable={false}
      >
        <path d={paths[shape]} />
      </svg>
    </div>
  );
}
