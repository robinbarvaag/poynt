import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";
import { cn } from "../../lib/utils";

// Heading variants
const headingVariants = cva("tracking-tight text-foreground", {
  variants: {
    size: {
      display: "text-5xl md:text-6xl lg:text-7xl font-extrabold",
      h1: "text-4xl md:text-5xl lg:text-6xl font-bold",
      h2: "text-3xl md:text-4xl font-bold",
      h3: "text-2xl md:text-3xl font-semibold",
      h4: "text-xl md:text-2xl font-semibold",
    },
  },
  defaultVariants: {
    size: "h1",
  },
});

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, size, as, children, ...props }, ref) => {
    // Map size to default HTML element
    const sizeToElement: Record<string, "h1" | "h2" | "h3" | "h4"> = {
      display: "h1",
      h1: "h1",
      h2: "h2",
      h3: "h3",
      h4: "h4",
    };
    const Component = as || sizeToElement[size || "h1"] || "h1";
    return (
      <Component
        ref={ref}
        className={cn(headingVariants({ size, className }))}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
Heading.displayName = "Heading";

// Text variants
const textVariants = cva("", {
  variants: {
    variant: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      lead: "text-xl text-muted-foreground",
      large: "text-lg font-semibold",
      small: "text-sm font-medium leading-none",
      subtle: "text-sm text-muted-foreground",
    },
    size: {
      default: "text-base",
      sm: "text-sm",
      lg: "text-lg",
      xl: "text-xl",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export interface TextProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof textVariants> {
  as?: "p" | "span" | "div";
}

const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ className, variant, size, as = "p", children, ...props }, ref) => {
    const Component = as;
    return (
      <Component
        ref={ref}
        className={cn(textVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
Text.displayName = "Text";

// Convenience components
const H1 = React.forwardRef<
  HTMLHeadingElement,
  Omit<HeadingProps, "size" | "as">
>(({ className, ...props }, ref) => (
  <Heading ref={ref} size="h1" as="h1" className={className} {...props} />
));
H1.displayName = "H1";

const H2 = React.forwardRef<
  HTMLHeadingElement,
  Omit<HeadingProps, "size" | "as">
>(({ className, ...props }, ref) => (
  <Heading ref={ref} size="h2" as="h2" className={className} {...props} />
));
H2.displayName = "H2";

const H3 = React.forwardRef<
  HTMLHeadingElement,
  Omit<HeadingProps, "size" | "as">
>(({ className, ...props }, ref) => (
  <Heading ref={ref} size="h3" as="h3" className={className} {...props} />
));
H3.displayName = "H3";

const H4 = React.forwardRef<
  HTMLHeadingElement,
  Omit<HeadingProps, "size" | "as">
>(({ className, ...props }, ref) => (
  <Heading ref={ref} size="h4" as="h4" className={className} {...props} />
));
H4.displayName = "H4";

const Lead = React.forwardRef<
  HTMLParagraphElement,
  Omit<TextProps, "variant">
>(({ className, ...props }, ref) => (
  <Text ref={ref} variant="lead" className={className} {...props} />
));
Lead.displayName = "Lead";

const Muted = React.forwardRef<
  HTMLParagraphElement,
  Omit<TextProps, "variant">
>(({ className, ...props }, ref) => (
  <Text ref={ref} variant="muted" className={className} {...props} />
));
Muted.displayName = "Muted";

export {
  Heading,
  headingVariants,
  Text,
  textVariants,
  H1,
  H2,
  H3,
  H4,
  Lead,
  Muted,
};
