import { cn } from "@poynt/ui";

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
  /** Maximum width variant */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /** Vertical padding variant */
  padding?: "none" | "sm" | "md" | "lg";
  /** Whether to add top margin for pages without hero */
  withTopMargin?: boolean;
}

const sizeClasses = {
  sm: "max-w-3xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-none",
};

const paddingClasses = {
  none: "",
  sm: "py-8 md:py-12",
  md: "py-12 md:py-16",
  lg: "py-16 md:py-24",
};

export function PageWrapper({
  children,
  className,
  size = "lg",
  padding = "md",
  withTopMargin = true,
}: PageWrapperProps) {
  return (
    <main
      className={cn(
        "mx-auto px-4 sm:px-6",
        sizeClasses[size],
        paddingClasses[padding],
        withTopMargin && "mt-8 md:mt-12",
        className
      )}
    >
      {children}
    </main>
  );
}
