"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { type VariantProps, cva } from "class-variance-authority";
import { motion, useReducedMotion } from "framer-motion";
import { CheckIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "@poynt/ui/lib/utils";

// Større og litt lekent: tydelig boks, myk fokusring og en liten «pop» når den
// hukes av. Squircle-form arves globalt (ikke rounded-full).
const checkboxVariants = cva(
  "peer shrink-0 border-2 border-input shadow-xs outline-none transition-[color,box-shadow,transform] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/40 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:data-[state=checked]:bg-primary",
  {
    variants: {
      size: {
        sm: "size-5 rounded-[7px]",
        md: "size-7 rounded-lg",
        lg: "size-9 rounded-xl",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

const iconSize = {
  sm: "size-3.5",
  md: "size-5",
  lg: "size-6",
} as const;

function Checkbox({
  className,
  size = "md",
  ...props
}: Omit<React.ComponentProps<typeof CheckboxPrimitive.Root>, "size"> &
  VariantProps<typeof checkboxVariants>) {
  const reduce = useReducedMotion();
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(checkboxVariants({ size, className }))}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current"
        asChild
      >
        {/* Fra 0.5 — aldri fra scale(0); ved redusert bevegelse kun fade. */}
        <motion.span
          initial={reduce ? { opacity: 0 } : { scale: 0.5, opacity: 0 }}
          animate={reduce ? { opacity: 1 } : { scale: 1, opacity: 1 }}
          transition={
            reduce
              ? { duration: 0.15 }
              : { type: "spring", stiffness: 600, damping: 22 }
          }
        >
          <CheckIcon className={cn(iconSize[size ?? "md"], "stroke-[3]")} />
        </motion.span>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox, checkboxVariants };
