import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

import { cn } from "@poynt/ui";

// Leken sveip-mekanikk via pseudo-elementer (holder Button som ÉTT element, så
// asChild fortsatt funker). `before` = aksent-flata som ligger forskjøvet bak
// som en hard skygge og sklir inn ved hover; `after` = base-flata som dekker i
// ro og fader bort. Tekstfargen settes per variant og bytter på hover.
const sweep =
  "before:absolute before:inset-0 before:-z-20 before:translate-x-2 before:translate-y-2 before:rounded-[inherit] before:transition-transform before:duration-300 before:ease-out before:content-[''] hover:before:translate-x-0 hover:before:translate-y-0 after:absolute after:inset-0 after:-z-10 after:rounded-[inherit] after:transition-opacity after:duration-300 after:content-[''] hover:after:opacity-0";

const buttonVariants = cva(
  "relative isolate inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Sveip-varianter (merkevareknappene)
        default: `${sweep} text-primary-foreground hover:text-foreground before:bg-saffron after:bg-primary`,
        saffron: `${sweep} text-foreground hover:text-primary-foreground before:bg-primary after:bg-saffron`,
        salmon: `${sweep} text-foreground hover:text-primary-foreground before:bg-primary after:bg-salmon`,
        ink: `${sweep} text-background hover:text-foreground before:bg-saffron after:bg-foreground`,
        // Nøytrale verktøy-varianter (uendret oppførsel)
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
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
