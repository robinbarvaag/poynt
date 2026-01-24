import { cn } from "@poynt/ui";

type BlobColor = "salmon" | "saffron" | "mint" | "accent" | "primary";

interface BlobShapeProps {
  color?: BlobColor;
  className?: string;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
}

const colorMap: Record<BlobColor, string> = {
  salmon: "fill-[oklch(0.793_0.124_7.590)]", // Salmon Pink
  saffron: "fill-[oklch(0.830_0.155_93.127)]", // Saffron
  mint: "fill-[oklch(0.959_0.049_201.168)]", // Mint Green
  accent: "fill-accent",
  primary: "fill-primary",
};

const sizeMap: Record<"sm" | "md" | "lg", string> = {
  sm: "w-32 h-32",
  md: "w-48 h-48",
  lg: "w-64 h-64",
};

export function BlobShape({
  color = "accent",
  className,
  size = "md",
  animate = false,
}: BlobShapeProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={cn(
        sizeMap[size],
        animate && "animate-blob",
        className
      )}
      aria-hidden="true"
    >
      <path
        className={cn(colorMap[color], "opacity-60")}
        d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.6,90,-16.3,89.5,-0.3C89,15.7,85.4,31.4,77.4,44.3C69.4,57.2,56.9,67.3,43.1,74.8C29.3,82.3,14.7,87.2,-0.4,87.8C-15.4,88.5,-30.9,84.9,-44.5,77.4C-58.2,69.9,-70.1,58.6,-78.3,44.8C-86.5,31,-91.1,15.5,-90.4,0.4C-89.7,-14.7,-83.8,-29.4,-75.2,-42.1C-66.6,-54.8,-55.3,-65.5,-42.1,-73.3C-28.9,-81,-14.5,-85.8,0.6,-86.8C15.6,-87.8,31.3,-85,44.7,-76.4Z"
        transform="translate(100 100)"
      />
    </svg>
  );
}
