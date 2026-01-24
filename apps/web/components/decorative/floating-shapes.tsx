import { cn } from "@poynt/ui";

interface FloatingShapesProps {
  className?: string;
  variant?: "default" | "subtle" | "vibrant";
}

export function FloatingShapes({
  className,
  variant = "default",
}: FloatingShapesProps) {
  const opacity = {
    default: "opacity-20",
    subtle: "opacity-10",
    vibrant: "opacity-30",
  };

  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden pointer-events-none -z-10",
        className
      )}
      aria-hidden="true"
    >
      {/* Salmon Pink circle - top right */}
      <div
        className={cn(
          "absolute -top-20 -right-20 w-72 h-72 rounded-full blur-3xl animate-float-slow",
          "bg-[oklch(0.793_0.124_7.590)]", // Salmon Pink
          opacity[variant]
        )}
      />

      {/* Saffron circle - bottom left */}
      <div
        className={cn(
          "absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-3xl animate-float-medium",
          "bg-[oklch(0.830_0.155_93.127)]", // Saffron
          opacity[variant]
        )}
      />

      {/* Mint Green circle - center right */}
      <div
        className={cn(
          "absolute top-1/2 -right-16 w-64 h-64 rounded-full blur-3xl animate-float-fast",
          "bg-[oklch(0.959_0.049_201.168)]", // Mint Green
          opacity[variant]
        )}
      />

      {/* Accent circle - top left */}
      <div
        className={cn(
          "absolute top-20 left-1/4 w-48 h-48 rounded-full blur-3xl animate-float-medium",
          "bg-accent",
          opacity[variant]
        )}
      />
    </div>
  );
}
