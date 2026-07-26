import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@poynt/ui";

// Kortet er bygget i samme «modige fargeblokk»-språk som FeatureGrid/INSPO
// (PayPal-kortene): store, runde hjørner, romslig luft og et lite løft på hover.
// `surface` styrer flate + tekstfarge. `default` er det nøytrale kortet (lys flate
// + tynn ring); de mettede flatene (saffron/salmon/primary/ink) gir fargeblokk-
// looken. Når du bruker en farget surface, sett selv kontrastfarger på
// beskrivelse/aksenter via className (text-muted-foreground passer ikke der).
const cardVariants = cva(
  "group/card flex flex-col gap-5 overflow-hidden rounded-3xl py-6 text-sm shadow-sm transition-[box-shadow,border-color,background-color] duration-300 hover:shadow-md has-[>img:first-child]:pt-0 data-[size=sm]:gap-4 data-[size=sm]:rounded-2xl data-[size=sm]:py-4 *:[img:first-child]:rounded-t-3xl *:[img:last-child]:rounded-b-3xl",
  {
    variants: {
      surface: {
        default: "bg-card text-card-foreground ring-1 ring-foreground/10",
        saffron: "bg-accent-1 text-foreground",
        salmon: "bg-accent-2 text-foreground",
        mint: "bg-accent-3 text-foreground",
        primary: "bg-primary text-primary-foreground",
        ink: "bg-foreground text-background",
      },
    },
    defaultVariants: {
      surface: "default",
    },
  }
);

function Card({
  className,
  size = "default",
  surface,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof cardVariants> & {
    size?: "default" | "sm";
    /** Render kortet på et annet element (f.eks. <button> eller <a>) via Slot. */
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "div";
  return (
    <Comp
      data-slot="card"
      data-size={size}
      data-surface={surface ?? "default"}
      className={cn(cardVariants({ surface }), className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "gap-1.5 rounded-t-3xl px-6 group-data-[size=sm]/card:px-4 [.border-b]:pb-5 group-data-[size=sm]/card:[.border-b]:pb-4 group/card-header @container/card-header grid auto-rows-min items-start has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto]",
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "text-lg leading-snug font-semibold tracking-tight group-data-[size=sm]/card:text-base",
        className
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6 group-data-[size=sm]/card:px-4", className)}
      {...props}
    />
  );
}

// Tynn skillelinje i PayPal/INSPO-stil. Bruker `border-current` så den tar farge
// fra kortets tekst (fungerer på både nøytrale og fargede surfaces).
function CardSeparator({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-separator"
      aria-hidden="true"
      className={cn(
        "mx-6 border-current/15 border-t group-data-[size=sm]/card:mx-4",
        className
      )}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "mt-1 flex items-center border-current/10 border-t px-6 pt-5 group-data-[size=sm]/card:px-4 group-data-[size=sm]/card:pt-4",
        className
      )}
      {...props}
    />
  );
}

export {
  Card,
  cardVariants,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  CardSeparator,
};
