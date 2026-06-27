import { Icon } from "../../icons";
import { cn } from "../../lib/utils";

export type BrandHeaderSurface =
  | "cream"
  | "mint"
  | "saffron"
  | "salmon"
  | "primary"
  | "ink";

const surfaceClasses: Record<BrandHeaderSurface, string> = {
  cream: "bg-cream text-foreground ring-foreground/10",
  mint: "bg-mint/60 text-foreground ring-foreground/10",
  saffron: "bg-saffron/50 text-foreground ring-foreground/10",
  salmon: "bg-salmon/50 text-foreground ring-foreground/10",
  primary: "bg-primary text-primary-foreground ring-white/10",
  ink: "bg-foreground text-background ring-white/10",
};

export interface BrandHeaderProps {
  name: string;
  logoUrl?: string | null;
  tagline?: string | null;
  surface?: BrandHeaderSurface;
  className?: string;
}

/**
 * Toppflaten i merkevare-boka: logo (eller initial-fallback) på en brand-surface,
 * med bedriftsnavn og tagline. Bevisst stor og rolig — dette er «forsiden».
 */
export function BrandHeader({
  name,
  logoUrl,
  tagline,
  surface = "cream",
  className,
}: BrandHeaderProps) {
  const onDark = surface === "primary" || surface === "ink";
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-5 rounded-3xl p-8 text-center ring-1 md:p-12",
        surfaceClasses[surface],
        className
      )}
    >
      <div
        className={cn(
          "flex size-24 items-center justify-center overflow-hidden rounded-2xl ring-1 md:size-28",
          onDark
            ? "bg-white/10 ring-white/15"
            : "bg-background ring-foreground/10"
        )}
      >
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={`${name} logo`}
            className="size-full object-contain p-2"
          />
        ) : (
          <Icon name="image" className="size-8 opacity-40" />
        )}
      </div>
      <div className="space-y-1.5">
        <h2 className="font-heading text-3xl tracking-tight md:text-4xl">
          {name}
        </h2>
        {tagline && (
          <p
            className={cn(
              "text-lg",
              onDark ? "opacity-90" : "text-muted-foreground"
            )}
          >
            {tagline}
          </p>
        )}
      </div>
    </div>
  );
}
