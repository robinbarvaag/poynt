import { cn } from "@poynt/ui";
import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

// Pill-merkelapp. Holdes ekte rund (rounded-full → corner-shape: round, ikke
// squircle). Sett `dot` for en liten statusprikk foran innholdet. Bevisst uten
// ikon-støtte — ren tekst (+ ev. dot) holder uttrykket rolig.
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center font-semibold whitespace-nowrap rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Solide flater
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        muted: "bg-muted text-muted-foreground",
        accent: "bg-accent text-accent-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-border text-foreground",
        // Merkevare-toner — lekne, mettede pills
        saffron: "bg-accent-1 text-foreground",
        salmon: "bg-accent-2 text-foreground",
        mint: "bg-accent-3 text-foreground",
        // Myke/tonale varianter — dempet flate, farget tekst
        "soft-primary": "bg-primary/12 text-primary",
        "soft-saffron": "bg-accent-1/40 text-foreground",
        "soft-salmon": "bg-accent-2/40 text-foreground",
        "soft-destructive": "bg-destructive/12 text-destructive",
      },
      size: {
        sm: "gap-1 px-2.5 py-0.5 text-xs",
        md: "gap-1.5 px-3 py-1 text-sm",
        lg: "gap-1.5 px-3.5 py-1.5 text-sm",
        xl: "gap-2 px-4 py-2 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Liten statusprikk foran innholdet (arver tekstfargen). */
  dot?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, dot, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    >
      {dot && (
        <span
          aria-hidden="true"
          className="size-1.5 shrink-0 rounded-full bg-current"
        />
      )}
      {children}
    </span>
  )
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
