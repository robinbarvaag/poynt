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
}

export function OptionCard({
  value,
  label,
  description,
  icon,
  isSelected,
  onClick,
  className,
}: OptionCardProps) {
  return (
    <Card
      key={value}
      className={cn(
        "cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md",
        isSelected
          ? "ring-2 ring-primary bg-primary/5 border-primary"
          : "hover:border-primary/50",
        className
      )}
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
    </Card>
  );
}
