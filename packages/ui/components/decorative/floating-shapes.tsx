import { cn } from "../../lib/utils";

interface FloatingShapesProps {
  variant?: "default" | "subtle" | "vibrant";
  className?: string;
}

// Synlighet per variant. `vibrant` bruker mindre blur i tillegg til høyere
// opacity, slik at formene faktisk leser som former (jf. INSPO/shapes) og ikke
// bare en svak fargeskygge.
const variantMap = {
  subtle: { opacity: "opacity-15", blur: "blur-3xl" },
  default: { opacity: "opacity-25", blur: "blur-3xl" },
  vibrant: { opacity: "opacity-45", blur: "blur-2xl" },
} as const;

/**
 * Lag av myke, flytende fargeflekker som driver sakte i bakgrunnen — «alt
 * puster». Legg i en `relative`-container og gi innholdet `relative z-10`
 * over: flekkene ligger på `z-0` (over containerens egen bakgrunn, under
 * innholdet). Rent dekorativ (aria-hidden, pointer-events-none).
 */
export function FloatingShapes({
  variant = "default",
  className,
}: FloatingShapesProps) {
  const { opacity, blur } = variantMap[variant];
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-0 overflow-hidden",
        className
      )}
      aria-hidden="true"
    >
      <div
        className={cn(
          "-top-10 -right-8 absolute size-72 animate-float-slow rounded-full bg-accent-2",
          blur,
          opacity
        )}
      />
      <div
        className={cn(
          "-bottom-16 -left-16 absolute size-96 animate-float-medium rounded-[60%_40%_55%_45%/50%_60%_40%_50%] bg-accent-1",
          blur,
          opacity
        )}
      />
      <div
        className={cn(
          "-right-8 absolute top-1/2 size-64 animate-float-fast rounded-full bg-accent-3",
          blur,
          opacity
        )}
      />
      <div
        className={cn(
          "absolute top-12 left-1/4 size-48 animate-float-medium rounded-[50%_50%_45%_55%/55%_45%_55%_45%] bg-accent",
          blur,
          opacity
        )}
      />
    </div>
  );
}
