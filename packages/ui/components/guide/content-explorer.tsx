"use client";

import { type ReactNode, useMemo, useState } from "react";
import { cn } from "../../lib/utils";
import {
  ContentFilterBar,
  type ContentFilterOption,
} from "./content-filter-bar";

export interface ContentExplorerContext {
  /** Ingen filter eller søk aktivt — lista viser alt, i original rekkefølge. */
  isDefaultView: boolean;
  activeFilter: string;
  query: string;
}

export interface ContentExplorerProps<T> {
  items: T[];
  /** Filter-piller. Første option regnes som «alle» og slår av filtrering. */
  options: ContentFilterOption[];
  /** Om et element hører til en filter-verdi (kalles aldri for «alle»-valget). */
  matchesFilter: (item: T, value: string) => boolean;
  /**
   * Lowercased søketekst for et element. Utelat for å skjule søkefeltet.
   */
  searchText?: (item: T) => string;
  searchPlaceholder?: string;
  searchLabel?: string;
  /** Vises når filter/søk ikke gir treff. */
  emptyState?: ReactNode;
  /** Rendrer de synlige elementene — innholdet bestemmer selv kortene sine. */
  children: (visible: T[], context: ContentExplorerContext) => ReactNode;
  className?: string;
}

/**
 * Felles mønster for filtrerbare innholds-lister: eier filter- og søke-state,
 * rendrer `ContentFilterBar` og overlater kort-rendringen til `children`.
 * Serversiden henter innholdet; en tynn klient-wrapper (f.eks. `BlogExplorer`)
 * leverer `matchesFilter`/`searchText` og kortene.
 */
export function ContentExplorer<T>({
  items,
  options,
  matchesFilter,
  searchText,
  searchPlaceholder,
  searchLabel,
  emptyState,
  children,
  className,
}: ContentExplorerProps<T>) {
  const allValue = options[0]?.value ?? "alle";
  const [activeFilter, setActiveFilter] = useState(allValue);
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();

  const visible = useMemo(
    () =>
      items.filter(
        (item) =>
          (activeFilter === allValue || matchesFilter(item, activeFilter)) &&
          (normalizedQuery === "" ||
            (searchText?.(item) ?? "").includes(normalizedQuery))
      ),
    [items, activeFilter, allValue, matchesFilter, normalizedQuery, searchText]
  );

  const context: ContentExplorerContext = {
    isDefaultView: activeFilter === allValue && normalizedQuery === "",
    activeFilter,
    query,
  };

  // Uten innhold er filter og søk meningsløse — vis bare tom-tilstanden.
  if (items.length === 0) {
    return <div className={className}>{emptyState}</div>;
  }

  return (
    <div className={cn("space-y-10", className)}>
      <ContentFilterBar
        options={options}
        value={activeFilter}
        onChange={setActiveFilter}
        query={searchText ? query : undefined}
        onQueryChange={searchText ? setQuery : undefined}
        searchPlaceholder={searchPlaceholder}
        searchLabel={searchLabel}
      />

      {/* Re-mount på filterbytte gir en kort, rolig inntoning av det nye
          resultatsettet i stedet for at gridden snapper. Bevisst IKKE nøklet
          på søketeksten — å re-animere per tastetrykk ville vært støy. */}
      <div
        key={activeFilter}
        className="motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:animate-in motion-safe:duration-200 motion-safe:ease-soft"
      >
        {visible.length > 0 ? children(visible, context) : emptyState}
      </div>
    </div>
  );
}
