"use client";

import { motion } from "framer-motion";
import { Icon, type IconName } from "../../icons";
import { cn } from "../../lib/utils";

interface FormHeaderProps {
  icon: IconName;
  title: string;
  description: string;
  estimatedTime?: string;
  iconBgColor?: string;
  iconColor?: string;
}

export function FormHeader({
  icon,
  title,
  description,
  estimatedTime,
  iconBgColor = "bg-primary/10",
  iconColor = "text-primary",
}: FormHeaderProps) {
  return (
    <div className="flex flex-col items-center text-center space-y-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className={cn(
          "size-16 rounded-2xl flex items-center justify-center",
          iconBgColor,
          iconColor
        )}
      >
        <Icon name={icon} className="size-8" />
      </motion.div>

      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-lg text-muted-foreground max-w-md">{description}</p>
      </div>

      {estimatedTime && (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Icon name="clock" className="size-4" />
          {estimatedTime}
        </p>
      )}
    </div>
  );
}
