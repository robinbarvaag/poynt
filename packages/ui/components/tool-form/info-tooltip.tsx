"use client";

import { Icon } from "../../icons";
import { cn } from "../../lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../tooltip";

interface InfoTooltipProps {
  content: string;
  title?: string;
  className?: string;
}

export function InfoTooltip({ content, title, className }: InfoTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center size-4 rounded-full",
              "text-muted-foreground hover:text-foreground transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              className
            )}
          >
            <Icon name="alert-triangle" className="size-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          {title && <p className="font-medium mb-1">{title}</p>}
          <p className="text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
