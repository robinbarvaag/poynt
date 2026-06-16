import type { ComponentProps } from "react";
import { cn } from "../lib/utils";

interface EyebrowProps extends ComponentProps<"span"> {
  /** Vis en marker-strek foran teksten (Steps/ContentMedia-stil). */
  marker?: boolean;
  /** Ekstra klasser på marker-streken, typisk farge (f.eks. "bg-saffron"). */
  markerClassName?: string;
}

/**
 * Liten etikett over titler ("HVORFOR POYNT", "Steg 01"). Sentralt sted for
 * eyebrow-stilen — endrer du den her, endres den overalt. Tekstfarge settes via
 * `className` (default dempet); marker-strekens farge via `markerClassName`
 * (default = tekstfargen).
 */
export function Eyebrow({
  marker,
  markerClassName,
  className,
  children,
  ...props
}: EyebrowProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-3 font-heading font-semibold text-muted-foreground text-sm uppercase tracking-[0.2em]",
        className
      )}
      {...props}
    >
      {marker && (
        <span
          aria-hidden="true"
          className={cn("h-1 w-10 rounded-full bg-current", markerClassName)}
        />
      )}
      {children}
    </span>
  );
}
