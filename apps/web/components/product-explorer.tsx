"use client";

import {
  ContentExplorer,
  type ContentFilterOption,
  ProductGrid,
  type ProductGridItem,
} from "@poynt/ui";
import { useCallback } from "react";

export interface ProductExplorerItem extends ProductGridItem {
  /** Produkttype-slug (course/pdf/bundle/…) for filtrering. */
  type: string;
  /** Forhåndsbygd, lowercased søketekst (navn + kort beskrivelse). */
  search: string;
}

interface ProductExplorerProps {
  products: ProductExplorerItem[];
  filters: ContentFilterOption[];
  emptyStateText: string;
}

/**
 * Tynn wrapper rundt det generiske `ContentExplorer`-mønsteret for
 * produktoversikten — samme filter-/søkeopplevelse som bloggen (klient-side,
 * uten server-runde), i stedet for det gamle URL-param-filteret i heroen.
 */
export function ProductExplorer({
  products,
  filters,
  emptyStateText,
}: ProductExplorerProps) {
  const matchesFilter = useCallback(
    (product: ProductExplorerItem, value: string) => product.type === value,
    []
  );
  const searchText = useCallback(
    (product: ProductExplorerItem) => product.search,
    []
  );

  return (
    <ContentExplorer
      items={products}
      options={[{ value: "alle", label: "Alle" }, ...filters]}
      matchesFilter={matchesFilter}
      searchText={searchText}
      searchPlaceholder="Søk i produkter …"
      searchLabel="Søk i produkter"
      emptyState={
        <p className="py-12 text-center text-muted-foreground">
          {emptyStateText}
        </p>
      }
    >
      {(visible) => (
        <ProductGrid
          products={visible.map(({ type: _t, search: _s, ...rest }) => rest)}
        />
      )}
    </ContentExplorer>
  );
}
