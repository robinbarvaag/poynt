import type * as React from "react";
import { cn } from "../../lib/utils";
import { Avatar, AvatarFallback } from "../avatar";

export interface AuthorBylineProps {
  name: string;
  role?: string;
  /** Datotekst, ferdig formatert (f.eks. «12. juni 2026»). */
  date?: string;
  /** Avatar-bilde. Faller tilbake til initialer. */
  avatar?: React.ReactNode;
  size?: "sm" | "default";
  className?: string;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Forfatter-linje for redaksjonelt innhold: avatar, navn, rolle og dato.
 * Faller tilbake til initialer når det ikke finnes et bilde.
 */
export function AuthorByline({
  name,
  role,
  date,
  avatar,
  size = "default",
  className,
}: AuthorBylineProps) {
  const isSm = size === "sm";
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Avatar className={isSm ? "size-8" : "size-10"}>
        {avatar}
        <AvatarFallback className="bg-accent-3/60 font-heading font-semibold text-foreground text-xs">
          {initials(name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col leading-tight">
        <span
          className={cn(
            "font-semibold text-foreground",
            isSm ? "text-sm" : "text-sm"
          )}
        >
          {name}
        </span>
        {(role || date) && (
          <span className="text-muted-foreground text-xs">
            {[role, date].filter(Boolean).join(" · ")}
          </span>
        )}
      </div>
    </div>
  );
}
