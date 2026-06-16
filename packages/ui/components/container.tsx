import { cn } from "@poynt/ui";
import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

const containerVariants = cva("mx-auto w-full px-4", {
  variants: {
    size: {
      sm: "max-w-3xl",
      default: "max-w-6xl",
      lg: "max-w-7xl",
      full: "max-w-none",
    },
    padding: {
      none: "py-0",
      sm: "py-2",
      default: "py-4 md:py-8",
      lg: "py-8 md:py-12",
      xl: "py-12 md:py-24",
    },
  },
  defaultVariants: {
    size: "default",
    padding: "default",
  },
});

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {
  as?: "div" | "section" | "article" | "main" | "header" | "footer";
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size, padding, as = "div", children, ...props }, ref) => {
    const Component = as;
    return (
      <Component
        ref={ref}
        className={cn(containerVariants({ size, padding, className }))}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
Container.displayName = "Container";

// Full-bredde seksjon med fargevariant og fast vertikal rytme (spacing).
const sectionVariants = cva("w-full", {
  variants: {
    variant: {
      default: "",
      muted: "bg-muted",
      primary: "bg-primary text-primary-foreground",
      accent: "bg-accent text-accent-foreground",
      secondary: "bg-secondary",
      mint: "bg-mint",
      saffron: "bg-saffron",
      salmon: "bg-salmon text-foreground",
    },
    // Tillatte seksjons-avstander — hold deg til disse for konsistent rytme.
    spacing: {
      none: "py-0",
      sm: "py-12 md:py-16",
      md: "py-16 md:py-24",
      lg: "py-24 md:py-32",
      xl: "py-32 md:py-44",
    },
  },
  defaultVariants: {
    variant: "default",
    spacing: "md",
  },
});

export interface SectionProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof sectionVariants> {}

const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ className, variant, spacing, children, ...props }, ref) => (
    <section
      ref={ref}
      className={cn(sectionVariants({ variant, spacing, className }))}
      {...props}
    >
      {children}
    </section>
  )
);
Section.displayName = "Section";

// Vertikal stabel med fast avstand mellom barn (tillatte gap-verdier).
const stackVariants = cva("flex flex-col", {
  variants: {
    gap: {
      xs: "gap-2",
      sm: "gap-4",
      md: "gap-6",
      lg: "gap-10",
      xl: "gap-16",
    },
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
    },
  },
  defaultVariants: {
    gap: "md",
    align: "stretch",
  },
});

export interface StackProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof stackVariants> {}

const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ className, gap, align, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(stackVariants({ gap, align, className }))}
      {...props}
    />
  )
);
Stack.displayName = "Stack";

export {
  Container,
  containerVariants,
  Section,
  sectionVariants,
  Stack,
  stackVariants,
};
