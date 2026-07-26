"use client";

import { motion } from "framer-motion";
import { Icon, type IconName } from "../../icons";
import { cn } from "../../lib/utils";
import { Card, CardContent } from "../card";

interface OptionCardProps {
  value: string;
  label: string;
  description?: string;
  icon?: IconName;
  isSelected: boolean;
  onClick: () => void;
  className?: string;
  /**
   * Form på markøren. `radio` (default) for enkeltvalg, `checkbox` for fler-
   * valg (f.eks. kanaler) — samme kort-look, men firkant med hake.
   */
  indicator?: "radio" | "checkbox";
}

export function OptionCard({
  value,
  label,
  description,
  icon,
  isSelected,
  onClick,
  className,
  indicator = "radio",
}: OptionCardProps) {
  return (
    <Card
      asChild
      className={cn(
        "w-full text-left transition-[border-color,background-color,box-shadow] duration-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        isSelected
          ? "ring-2 ring-primary bg-primary/5 border-primary"
          : "hover:border-primary/50",
        className
      )}
    >
      <button
        type="button"
        data-value={value}
        aria-pressed={isSelected}
        onClick={(e) => {
          e.preventDefault();
          onClick();
        }}
      >
        <CardContent className="flex items-center gap-3 p-4">
          {icon && (
            <div
              className={cn(
                "size-10 rounded-lg flex items-center justify-center shrink-0",
                isSelected
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Icon name={icon} className="size-5" />
            </div>
          )}

          {indicator === "checkbox" ? (
            <div
              className={cn(
                "size-5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0",
                isSelected
                  ? "border-primary bg-primary text-white"
                  : "border-muted-foreground/30"
              )}
            >
              {isSelected && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex"
                >
                  <Icon name="check" className="size-3.5" />
                </motion.span>
              )}
            </div>
          ) : (
            <div
              className={cn(
                "size-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                isSelected
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/30"
              )}
            >
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="size-2 rounded-full bg-white"
                />
              )}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <span
              className={cn("font-medium block", isSelected && "text-primary")}
            >
              {label}
            </span>
            {description && (
              <span className="text-sm text-muted-foreground block mt-0.5">
                {description}
              </span>
            )}
          </div>
        </CardContent>
      </button>
    </Card>
  );
}
