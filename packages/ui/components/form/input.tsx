import type { VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@poynt/ui";
import { controlSizeVariants } from "./control-size";

export interface InputProps
  extends React.ComponentProps<"input">,
    VariantProps<typeof controlSizeVariants> {}

// Høyde/padding/skrift styres av den delte `controlSizeVariants` (sm/default/lg)
// slik at Input matcher Button med samme størrelses-nøkkel — se control-size.ts.
function Input({ className, type, sizeVariant, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        controlSizeVariants({ sizeVariant }),
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-lg border bg-transparent shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  );
}

export { Input };
