import { cn } from "@poynt/ui";

type WaveColor = "primary" | "accent" | "salmon" | "saffron" | "mint" | "muted";
type WaveVariant = "top" | "bottom";

interface WaveDividerProps {
  variant?: WaveVariant;
  color?: WaveColor;
  className?: string;
}

const colorMap: Record<WaveColor, string> = {
  primary: "fill-primary",
  accent: "fill-accent",
  salmon: "fill-[oklch(0.793_0.124_7.590)]", // Salmon Pink
  saffron: "fill-[oklch(0.830_0.155_93.127)]", // Saffron
  mint: "fill-[oklch(0.959_0.049_201.168)]", // Mint Green
  muted: "fill-muted",
};

export function WaveDivider({
  variant = "top",
  color = "muted",
  className,
}: WaveDividerProps) {
  const isTop = variant === "top";

  return (
    <div
      className={cn(
        "w-full overflow-hidden leading-[0]",
        isTop ? "-mb-[1px]" : "-mt-[1px] rotate-180",
        className
      )}
    >
      <svg
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        className={cn("w-full h-[60px] md:h-[80px]", colorMap[color])}
        aria-hidden="true"
        focusable={false}
      >
        <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" />
      </svg>
    </div>
  );
}
