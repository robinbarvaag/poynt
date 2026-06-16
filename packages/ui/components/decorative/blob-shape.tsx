import { cn } from "../../lib/utils";

type BlobColor = "salmon" | "saffron" | "mint" | "accent" | "primary";

interface BlobShapeProps {
  color?: BlobColor;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
  className?: string;
}

const fillMap: Record<BlobColor, string> = {
  salmon: "fill-salmon",
  saffron: "fill-saffron",
  mint: "fill-mint",
  accent: "fill-accent",
  primary: "fill-primary",
};

const sizeMap = {
  sm: "size-32",
  md: "size-48",
  lg: "size-64",
} as const;

/** Organisk blob-form. Dekorativ — bruk som fargeflekk bak innhold. */
export function BlobShape({
  color = "accent",
  size = "md",
  animate = false,
  className,
}: BlobShapeProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={cn(sizeMap[size], animate && "animate-blob", className)}
      aria-hidden="true"
    >
      <path
        className={cn(fillMap[color], "opacity-60")}
        d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.6,90,-16.3,89.5,-0.3C89,15.7,85.4,31.4,77.4,44.3C69.4,57.2,56.9,67.3,43.1,74.8C29.3,82.3,14.7,87.2,-0.4,87.8C-15.4,88.5,-30.9,84.9,-44.5,77.4C-58.2,69.9,-70.1,58.6,-78.3,44.8C-86.5,31,-91.1,15.5,-90.4,0.4C-89.7,-14.7,-83.8,-29.4,-75.2,-42.1C-66.6,-54.8,-55.3,-65.5,-42.1,-73.3C-28.9,-81,-14.5,-85.8,0.6,-86.8C15.6,-87.8,31.3,-85,44.7,-76.4Z"
        transform="translate(100 100)"
      />
    </svg>
  );
}
