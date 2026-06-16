import { cn } from "../../lib/utils";

type DecorColor =
  | "primary"
  | "accent"
  | "salmon"
  | "saffron"
  | "mint"
  | "muted"
  | "secondary";

interface WaveDividerProps {
  variant?: "top" | "bottom";
  color?: DecorColor;
  className?: string;
}

const fillMap: Record<DecorColor, string> = {
  primary: "fill-primary",
  accent: "fill-accent",
  salmon: "fill-salmon",
  saffron: "fill-saffron",
  mint: "fill-mint",
  muted: "fill-muted",
  secondary: "fill-secondary",
};

/** Bølge-formet overgang mellom to fargeseksjoner. */
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
        isTop ? "-mb-px" : "-mt-px rotate-180",
        className
      )}
    >
      <svg
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        className={cn("h-[60px] w-full md:h-[80px]", fillMap[color])}
        aria-hidden="true"
        focusable={false}
      >
        <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" />
      </svg>
    </div>
  );
}
