import { cn } from "../../lib/utils";
import { ColorSwatch } from "./color-swatch";

export interface SwatchGridColor {
  hex: string;
  name?: string | null;
  role?: string | null;
}

export interface SwatchGridProps {
  colors: SwatchGridColor[];
  /** Skjul kopiér-knappene (ren visning). */
  hideCopy?: boolean;
  className?: string;
}

/**
 * Responsivt rutenett av `ColorSwatch` — merkevarens fargepalett.
 */
export function SwatchGrid({ colors, hideCopy, className }: SwatchGridProps) {
  if (colors.length === 0) return null;
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4",
        className
      )}
    >
      {colors.map((c, i) => (
        <ColorSwatch
          key={`${c.hex}-${i}`}
          hex={c.hex}
          name={c.name}
          role={c.role}
          hideCopy={hideCopy}
        />
      ))}
    </div>
  );
}
