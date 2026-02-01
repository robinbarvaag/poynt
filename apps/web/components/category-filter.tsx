"use client";

import { cn } from "@poynt/ui";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface Category {
  value: string;
  label: string;
  count?: number;
}

interface CategoryFilterProps {
  categories: Category[];
  paramName?: string;
  allLabel?: string;
}

export function CategoryFilter({
  categories,
  paramName = "kategori",
  allLabel = "Alle",
}: CategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get(paramName);

  const handleCategoryClick = useCallback(
    (value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(paramName, value);
      } else {
        params.delete(paramName);
      }
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams, paramName]
  );

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleCategoryClick(null)}
        className={cn(
          "px-3 py-1.5 text-sm rounded-md transition-colors",
          !currentCategory
            ? "bg-foreground text-background font-medium"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        {allLabel}
      </button>
      {categories.map((category) => (
        <button
          key={category.value}
          onClick={() => handleCategoryClick(category.value)}
          className={cn(
            "px-3 py-1.5 text-sm rounded-md transition-colors",
            currentCategory === category.value
              ? "bg-foreground text-background font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          {category.label}
          {category.count !== undefined && (
            <span className="ml-1 text-xs opacity-60">{category.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
