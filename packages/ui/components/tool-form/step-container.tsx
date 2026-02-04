"use client";

import { motion } from "framer-motion";
import { Icon, type IconName } from "../../icons";
import { cn } from "../../lib/utils";
import { Progress } from "../progress";

interface StepContainerProps {
  currentStep: number;
  totalSteps: number;
  stepIcon: IconName;
  stepTitle: string;
  stepDescription: string;
  children: React.ReactNode;
  className?: string;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 100 : -100,
    opacity: 0,
  }),
};

export function StepContainer({
  currentStep,
  totalSteps,
  stepIcon,
  stepTitle,
  stepDescription,
  children,
  className,
}: StepContainerProps) {
  const progressValue = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className={cn("space-y-8", className)}>
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-muted-foreground">
            Steg {currentStep + 1} av {totalSteps}
          </span>
          <span className="font-medium text-primary">
            {Math.round(progressValue)}%
          </span>
        </div>
        <Progress value={progressValue} className="h-2" />
      </div>

      {/* Step header with icon */}
      <div className="space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="inline-flex items-center justify-center size-12 rounded-xl bg-primary/10 text-primary"
        >
          <Icon name={stepIcon} className="size-6" />
        </motion.div>

        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">{stepTitle}</h2>
          <p className="text-muted-foreground">{stepDescription}</p>
        </div>
      </div>

      {/* Step content */}
      <div className="pt-2">{children}</div>
    </div>
  );
}
