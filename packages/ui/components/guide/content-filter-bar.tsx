"use client";

import { Icon, type IconName } from "../../icons";
import { cn } from "../../lib/utils";
import { Input } from "../form/input";

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
  /** Settes sammen med `onQueryChange` for å vise et søkefelt til høyre for pillene. */
  query?: string;
  onQueryChange?: (query: string) => void;
  searchPlaceholder?: string;
  searchLabel?: string;
  className?: string;
}

/**
 * Felles filter-rad (format/kategori) for innholds-lister, med valgfritt
 * søkefelt. Pille-stil, én aktiv om gangen. Kontrollert — eier ingen state
 * selv; brukes typisk via `ContentExplorer` eller en URL-param-wrapper.
 */
export function ContentFilterBar({
  options,
  value,
  onChange,
  query,
  onQueryChange,
  searchPlaceholder = "Søk …",
  searchLabel = "Søk i innhold",
  className,
}: ContentFilterBarProps) {
  const hasSearch = onQueryChange !== undefined;
  // En enslig «alle»-pille filtrerer ingenting — vis raden først når det
  // finnes noe å velge mellom.
  const hasPills = options.length > 1;

  const pills = hasPills && (
    <div className="flex flex-wrap gap-2" role="tablist">
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

  if (!hasSearch) {
    return pills ? <div className={className}>{pills}</div> : null;
  }

  // Søkefeltet ligger på egen rad — pillene kan bli mange og wrappe, og da
  // blir et felt ved siden av bare rot.
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="relative w-full sm:max-w-sm">
        <span className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3.5 text-muted-foreground">
          <Icon name="search" className="size-4" />
        </span>
        <Input
          type="search"
          value={query ?? ""}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="rounded-full pl-10"
          aria-label={searchLabel}
        />
      </div>

      {pills}
    </div>
  );
}
