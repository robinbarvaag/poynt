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
      // Mild veksel-flate for seksjonsrytmen — en hårfin Platinum-vask over
      // bakgrunnen, ikke den harde grå `muted`. Gir rolige overganger.
      soft: "bg-secondary/40",
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

// Responsivt rutenett med fast kolonnetall på desktop og fornuftig nedtrapping
// på mindre skjermer. Brukes som komposisjons-primitiv (jf. FeatureGrid = Grid
// + Card). Hold deg til de tillatte kolonne-/gap-verdiene for konsistent rytme.
const gridVariants = cva("grid grid-cols-1", {
  variants: {
    cols: {
      1: "",
      2: "sm:grid-cols-2",
      3: "sm:grid-cols-2 lg:grid-cols-3",
      4: "sm:grid-cols-2 lg:grid-cols-4",
    },
    gap: {
      xs: "gap-2",
      sm: "gap-4",
      md: "gap-6",
      lg: "gap-10",
      xl: "gap-16",
    },
  },
  defaultVariants: {
    cols: 3,
    gap: "md",
  },
});

export interface GridProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof gridVariants> {}

const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ className, cols, gap, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(gridVariants({ cols, gap, className }))}
      {...props}
    />
  )
);
Grid.displayName = "Grid";

export {
  Container,
  containerVariants,
  Section,
  sectionVariants,
  Stack,
  stackVariants,
  Grid,
  gridVariants,
};
