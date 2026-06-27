"use client";

import { Icon, type IconName } from "../../icons";
import { cn } from "../../lib/utils";

export interface ContentFilterOption {
  value: string;
  label: string;
  icon?: IconName;
  /** Liten fargeprikk (hex) som identitet — brukt for kanaler i stedet for emoji. */
  dot?: string;
}

export interface ContentFilterBarProps {
  options: ContentFilterOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/**
 * Felles filter-rad (format/kategori) for innholds-lister. Pille-stil, én aktiv
 * om gangen. Holdes som egen komponent så hub og under-lister filtrerer likt.
 */
export function ContentFilterBar({
  options,
  value,
  onChange,
  className,
}: ContentFilterBarProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)} role="tablist">
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-medium text-sm transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-foreground/[0.04] text-foreground/70 ring-1 ring-foreground/10 hover:bg-foreground/[0.07]"
            )}
          >
            {option.dot ? (
              <span
                aria-hidden="true"
                className={cn(
                  "size-2 shrink-0 rounded-full ring-1",
                  isActive ? "ring-primary-foreground/40" : "ring-foreground/10"
                )}
                style={{ backgroundColor: option.dot }}
              />
            ) : (
              option.icon && <Icon name={option.icon} className="size-3.5" />
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
