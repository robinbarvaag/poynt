"use client";

import { Icon } from "../../icons";
import { cn } from "../../lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../tooltip";

interface PrefilledBadgeProps {
  fieldName: string;
  source?: string;
  className?: string;
}

export function PrefilledBadge({
  fieldName,
  source = "bedriftsprofilen",
  className,
}: PrefilledBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full",
              "bg-blue-500/10 text-blue-600 dark:text-blue-400",
              "text-xs font-medium cursor-help",
              className
            )}
          >
            <Icon name="sparkles" className="size-3" />
            <span>Forhåndsutfylt</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium mb-1">Automatisk utfylt</p>
          <p className="text-xs text-muted-foreground">
            {fieldName} er hentet fra {source}. Du kan endre det om du vil.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
