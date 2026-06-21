import { cn } from "@poynt/ui";
import { type VariantProps, cva } from "class-variance-authority";
import type * as React from "react";

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

export type ContainerProps = React.ComponentProps<"div"> &
  VariantProps<typeof containerVariants> & {
    as?: "div" | "section" | "article" | "main" | "header" | "footer";
  };

function Container({
  className,
  size,
  padding,
  as: Component = "div",
  ...props
}: ContainerProps) {
  return (
    <Component
      data-slot="container"
      className={cn(containerVariants({ size, padding, className }))}
      {...props}
    />
  );
}

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
      sm: "py-8 md:py-12",
      md: "py-10 md:py-14",
      lg: "py-12 md:py-16",
      xl: "py-24 md:py-32",
    },
  },
  defaultVariants: {
    variant: "default",
    spacing: "md",
  },
});

export type SectionProps = React.ComponentProps<"section"> &
  VariantProps<typeof sectionVariants>;

function Section({ className, variant, spacing, ...props }: SectionProps) {
  return (
    <section
      data-slot="section"
      className={cn(sectionVariants({ variant, spacing, className }))}
      {...props}
    />
  );
}

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

export type StackProps = React.ComponentProps<"div"> &
  VariantProps<typeof stackVariants>;

function Stack({ className, gap, align, ...props }: StackProps) {
  return (
    <div
      data-slot="stack"
      className={cn(stackVariants({ gap, align, className }))}
      {...props}
    />
  );
}

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

export type GridProps = React.ComponentProps<"div"> &
  VariantProps<typeof gridVariants>;

function Grid({ className, cols, gap, ...props }: GridProps) {
  return (
    <div
      data-slot="grid"
      className={cn(gridVariants({ cols, gap, className }))}
      {...props}
    />
  );
}

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
