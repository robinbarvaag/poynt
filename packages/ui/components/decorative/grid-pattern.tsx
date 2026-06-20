import type { CSSProperties } from "react";
import { cn } from "../../lib/utils";

interface GridPatternProps {
  /** "dots" = punkt-rutenett (default), "grid" = tynne linjer. */
  variant?: "dots" | "grid";
  /** Cellestørrelse i px. Default 18. */
  size?: number;
  /**
   * Ton ut mot kantene med en radial maske — teksturen forsvinner mykt i stedet
   * for å stoppe brått. Fin som «fancy» aksent på kort/seksjoner.
   */
  fade?: boolean;
  className?: string;
}

/**
 * Subtil dot-/grid-tekstur (jf. Caide-INSPO — «noen kort har en grid-bakgrunn»).
 * Tar farge fra `currentColor`, så styr farge + synlighet med className
 * (f.eks. `text-foreground/10` eller `text-primary-foreground/25`). Legg i en
 * `relative`-container og gi innholdet `relative z-10` over. Rent dekorativ
 * (aria-hidden).
 */
export function GridPattern({
  variant = "dots",
  size = 18,
  fade = false,
  className,
}: GridPatternProps) {
  const backgroundImage =
    variant === "dots"
      ? "radial-gradient(currentColor 1.25px, transparent 1.25px)"
      : "linear-gradient(currentColor 1px, transparent 1px)," +
        "linear-gradient(to right, currentColor 1px, transparent 1px)";

  const style: CSSProperties = {
    backgroundImage,
    backgroundSize: `${size}px ${size}px`,
  };

  if (fade) {
    const mask =
      "radial-gradient(ellipse at center, #000 35%, transparent 72%)";
    style.maskImage = mask;
    style.WebkitMaskImage = mask;
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 text-foreground/7",
        className
      )}
      style={style}
    />
  );
}
