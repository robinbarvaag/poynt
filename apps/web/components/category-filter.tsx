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
    <div className="flex flex-wrap gap-2 justify-center">
      <button
        onClick={() => handleCategoryClick(null)}
        className={cn(
          "px-4 py-2 rounded-full text-sm font-medium transition-all",
          !currentCategory
            ? "bg-primary text-primary-foreground shadow-md"
            : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        {allLabel}
      </button>
      {categories.map((category) => (
        <button
          key={category.value}
          onClick={() => handleCategoryClick(category.value)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-all",
            currentCategory === category.value
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          {category.label}
          {category.count !== undefined && (
            <span className="ml-1.5 opacity-70">({category.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}
