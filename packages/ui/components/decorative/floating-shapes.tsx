import { cn } from "../../lib/utils";

interface FloatingShapesProps {
  variant?: "default" | "subtle" | "vibrant";
  className?: string;
}

const opacityMap = {
  default: "opacity-20",
  subtle: "opacity-10",
  vibrant: "opacity-30",
} as const;

/**
 * Lag av myke, flytende fargeflekker som driver sakte i bakgrunnen — «alt
 * puster». Legg i en `relative`-container; ligger bak innholdet (-z-10).
 */
export function FloatingShapes({
  variant = "default",
  className,
}: FloatingShapesProps) {
  const opacity = opacityMap[variant];
  return (
    <div
      className={cn(
        "-z-10 pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
      aria-hidden="true"
    >
      <div
        className={cn(
          "-top-20 -right-20 absolute size-72 animate-float-slow rounded-full bg-salmon blur-3xl",
          opacity
        )}
      />
      <div
        className={cn(
          "-bottom-32 -left-32 absolute size-96 animate-float-medium rounded-full bg-saffron blur-3xl",
          opacity
        )}
      />
      <div
        className={cn(
          "-right-16 absolute top-1/2 size-64 animate-float-fast rounded-full bg-mint blur-3xl",
          opacity
        )}
      />
      <div
        className={cn(
          "absolute top-20 left-1/4 size-48 animate-float-medium rounded-full bg-accent blur-3xl",
          opacity
        )}
      />
    </div>
  );
}
