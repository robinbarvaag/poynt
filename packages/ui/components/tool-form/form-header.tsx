"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Icon, type IconName } from "../../icons";
import { cn } from "../../lib/utils";
import { duration, easeSoft } from "../motion/motion-tokens";

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
  const reduce = useReducedMotion();
  return (
    <div className="flex flex-col items-center text-center space-y-6">
      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
        transition={{ duration: duration.fast, ease: easeSoft }}
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
