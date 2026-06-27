"use client";

import { Icon, type IconName } from "../../icons";
import { cn } from "../../lib/utils";

export interface ShareAction {
  icon: IconName;
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface ShareRowProps {
  /** Handlinger. Utelatt → «Lagre» og «Kopier lenke». */
  actions?: ShareAction[];
  /** Vis kun ikon (kompakt). */
  iconOnly?: boolean;
  className?: string;
}

const defaultActions: ShareAction[] = [
  { icon: "heart", label: "Lagre" },
  { icon: "share", label: "Del" },
];

/**
 * Rad med lagre/del-handlinger for redaksjonelt innhold. Presentasjon — koble på
 * faktisk oppførsel via `onClick`/`href`.
 */
export function ShareRow({ actions, iconOnly, className }: ShareRowProps) {
  const items = actions ?? defaultActions;
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {items.map((action) => {
        const Tag = action.href ? "a" : "button";
        return (
          <Tag
            key={action.label}
            href={action.href}
            onClick={action.onClick}
            type={action.href ? undefined : "button"}
            aria-label={iconOnly ? action.label : undefined}
            className={cn(
              "inline-flex items-center gap-2 rounded-full bg-foreground/[0.04] font-medium text-foreground/70 text-sm ring-1 ring-foreground/10 transition-colors hover:bg-foreground/[0.07] hover:text-foreground",
              iconOnly ? "size-9 justify-center" : "px-4 py-2"
            )}
          >
            <Icon name={action.icon} className="size-4" />
            {!iconOnly && action.label}
          </Tag>
        );
      })}
    </div>
  );
}
