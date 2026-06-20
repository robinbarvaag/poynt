"use client";

import {
  type BlogCategoryOption,
  BlogFilterBar,
  BlogGrid,
  type BlogGridItem,
} from "@poynt/ui";
import { useMemo, useState } from "react";

export interface BlogExplorerPost extends BlogGridItem {
  /** Slugs for alle kategorier innlegget har (for filtrering). */
  categorySlugs: string[];
  /** Forhåndsbygd, lowercased søketekst (tittel + utdrag). */
  search: string;
}

interface BlogExplorerProps {
  posts: BlogExplorerPost[];
  categories: BlogCategoryOption[];
  emptyStateText: string;
}

export function BlogExplorer({
  posts,
  categories,
  emptyStateText,
}: BlogExplorerProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const visiblePosts = useMemo<BlogGridItem[]>(() => {
    const q = query.trim().toLowerCase();
    return posts
      .filter(
        (post) =>
          (activeCategory === null ||
            post.categorySlugs.includes(activeCategory)) &&
          (q === "" || post.search.includes(q))
      )
      .map(({ categorySlugs: _c, search: _s, ...rest }) => rest);
  }, [posts, activeCategory, query]);

  const isDefaultView = activeCategory === null && query.trim() === "";

  return (
    <div className="space-y-10">
      <BlogFilterBar
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        query={query}
        onQueryChange={setQuery}
      />

      {visiblePosts.length > 0 ? (
        <BlogGrid posts={visiblePosts} featureFirst={isDefaultView} />
      ) : (
        <p className="py-12 text-center text-muted-foreground">
          {emptyStateText}
        </p>
      )}
    </div>
  );
}
