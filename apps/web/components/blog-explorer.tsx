"use client";

import {
  BlogGrid,
  type BlogGridItem,
  ContentExplorer,
  type ContentFilterOption,
} from "@poynt/ui";
import { useCallback } from "react";

export interface BlogExplorerPost extends BlogGridItem {
  /** Slugs for alle kategorier innlegget har (for filtrering). */
  categorySlugs: string[];
  /** Forhåndsbygd, lowercased søketekst (tittel + utdrag). */
  search: string;
}

interface BlogExplorerProps {
  posts: BlogExplorerPost[];
  categories: ContentFilterOption[];
  emptyStateText: string;
}

/**
 * Tynn wrapper rundt det generiske `ContentExplorer`-mønsteret: leverer
 * kategori-filter, søketekst og BlogGrid-kortene for blogg-oversikten.
 */
export function BlogExplorer({
  posts,
  categories,
  emptyStateText,
}: BlogExplorerProps) {
  const matchesFilter = useCallback(
    (post: BlogExplorerPost, value: string) =>
      post.categorySlugs.includes(value),
    []
  );
  const searchText = useCallback((post: BlogExplorerPost) => post.search, []);

  return (
    <ContentExplorer
      items={posts}
      options={[{ value: "alle", label: "Alle innlegg" }, ...categories]}
      matchesFilter={matchesFilter}
      searchText={searchText}
      searchPlaceholder="Søk i innlegg …"
      searchLabel="Søk i innlegg"
      emptyState={
        <p className="py-12 text-center text-muted-foreground">
          {emptyStateText}
        </p>
      }
    >
      {(visible, { isDefaultView }) => (
        <BlogGrid
          posts={visible.map(
            ({ categorySlugs: _c, search: _s, ...rest }) => rest
          )}
          featureFirst={isDefaultView}
        />
      )}
    </ContentExplorer>
  );
}
