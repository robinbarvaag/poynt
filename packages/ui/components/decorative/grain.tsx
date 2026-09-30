import { cn } from "../../lib/utils";

interface GrainProps {
  /** Kornstyrke. Default "subtle". */
  intensity?: "subtle" | "medium" | "strong";
  /**
   * Fest til viewporten (ett korn-lag over hele siden) i stedet for nærmeste
   * `relative`-container. Bruk dette til den globale, redaksjonelle teksturen.
   */
  fixed?: boolean;
  className?: string;
}

const intensityMap = {
  subtle: "opacity-[0.1]",
  medium: "opacity-[0.16]",
  strong: "opacity-[0.24]",
} as const;

/** Flisstørrelse i px. Liten nok til å være billig, stor nok til å ikke synes. */
const TILE = 256;

/**
 * Selve kornet som én liten, sømløst flisbar SVG (samme filter som før:
 * desaturert fraktalstøy, `stitchTiles` gjør kantene sømløse). Nettleseren
 * rasteriserer flisa én gang og gjentar den, i stedet for å regne ut
 * tre-oktavs støy for hele viewporten — og regne den på nytt ved hver
 * størrelsesendring. Det var merkbart på store skjermer og i Safari.
 */
const grainTile = `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='${TILE}' height='${TILE}'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23g)'/></svg>`
)}")`;

/**
 * Poynt-signaturen: en fin print-/papirkorn-tekstur (jf. docs/COMPOSITION.md).
 * Desaturert støy lagt over med `multiply` gir en taktil, redaksjonell
 * følelse uten å konkurrere med innholdet. Rent dekorativ (aria-hidden,
 * pointer-events-none) og helt statisk — ingen bevegelse å respektere.
 *
 * Global bruk: `<Grain fixed />` én gang i layouten. Lokalt på en flate:
 * legg i en `relative`-container.
 */
export function Grain({
  intensity = "subtle",
  fixed = false,
  className,
}: GrainProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none mix-blend-multiply",
        fixed ? "fixed inset-0 z-100" : "absolute inset-0",
        intensityMap[intensity],
        className
      )}
      style={{
        backgroundImage: grainTile,
        backgroundRepeat: "repeat",
        backgroundSize: `${TILE}px ${TILE}px`,
      }}
    />
  );
}
