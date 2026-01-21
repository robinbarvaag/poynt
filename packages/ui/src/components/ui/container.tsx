import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";
import { cn } from "../../lib/utils";

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
      sm: "py-8",
      default: "py-12 md:py-16",
      lg: "py-16 md:py-24",
      xl: "py-24 md:py-32",
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

// Section wrapper for consistent page sections
const Section = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & {
    variant?: "default" | "muted" | "primary" | "accent";
  }
>(({ className, variant = "default", children, ...props }, ref) => (
  <section
    ref={ref}
    className={cn(
      variant === "muted" && "bg-muted",
      variant === "primary" && "bg-primary text-primary-foreground",
      variant === "accent" && "bg-accent",
      className
    )}
    {...props}
  >
    {children}
  </section>
));
Section.displayName = "Section";

export { Container, containerVariants, Section };
