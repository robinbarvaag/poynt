import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

import { cn } from "@poynt/ui";
import { CONTROL_HEIGHTS } from "./form/control-size";

// Raffinert, ikke leken: squircle-form (Apple-aktige «continuous corners»)
// kommer globalt fra web.css, så her holder vi oss til avrunding + et dempet
// løft og en myk skygge på hover.
const buttonVariants = cva(
  "pressable relative inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-medium ring-offset-background transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Merkevare/CTA — solide flater, dempet løft på hover. `default` er den
        // primære handlingen; saffron/salmon/ink er merkevare-toner for variasjon.
        default:
          "bg-primary text-primary-foreground shadow-sm hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-md",
        saffron:
          "bg-saffron text-foreground shadow-sm hover:-translate-y-0.5 hover:shadow-md hover:brightness-[0.97]",
        salmon:
          "bg-salmon text-foreground shadow-sm hover:-translate-y-0.5 hover:shadow-md hover:brightness-[0.97]",
        ink: "bg-foreground text-background shadow-sm hover:-translate-y-0.5 hover:bg-foreground/90 hover:shadow-md",
        // Nøytral emfase-stige: outline (medium) og ghost (lav).
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        // Ortogonale roller: destructive (tydelig rød, farlig handling) og link.
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:-translate-y-0.5 hover:bg-destructive/90 hover:shadow-md",
        link: "text-primary underline-offset-4 hover:underline",
      },
      // Høydene deles med Input/Select via CONTROL_HEIGHTS, så en knapp og et
      // felt med samme størrelses-nøkkel alltid blir like høye. Padding er
      // knapp-spesifikk (romsligere horisontalt).
      size: {
        default: `${CONTROL_HEIGHTS.default} px-5 py-2`,
        sm: `${CONTROL_HEIGHTS.sm} px-3`,
        lg: `${CONTROL_HEIGHTS.lg} px-8`,
        icon: `${CONTROL_HEIGHTS.default} w-10`,
        // Kompakte ikon-knapper (brukt av chat-primitivene fra shadcn).
        "icon-sm": "size-8",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
