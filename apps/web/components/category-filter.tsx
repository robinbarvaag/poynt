"use client";

import { hexToRgba } from "@/lib/color-utils";
import { cn } from "@poynt/ui";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface Category {
  value: string;
  label: string;
  count?: number;
  color?: string;
  icon?: string;
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
    <div className="flex items-center gap-1 flex-wrap">
      <button
        type="button"
        onClick={() => handleCategoryClick(null)}
        className={cn(
          "px-3 py-1.5 text-sm rounded-full transition-colors",
          !currentCategory
            ? "bg-foreground text-background font-medium"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        {allLabel}
      </button>
      {categories.map((category) => {
        const isActive = currentCategory === category.value;
        const activeStyle =
          isActive && category.color
            ? { backgroundColor: category.color, color: "white" }
            : undefined;
        const hoverBg =
          !isActive && category.color
            ? hexToRgba(category.color, 0.1)
            : undefined;

        return (
          <button
            type="button"
            key={category.value}
            onClick={() => handleCategoryClick(category.value)}
            style={activeStyle}
            className={cn(
              "px-3 py-1.5 text-sm rounded-full transition-all",
              isActive
                ? !category.color && "bg-foreground text-background font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
            onMouseEnter={(e) => {
              if (!isActive && hoverBg) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  hoverBg;
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive && hoverBg) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "";
              }
            }}
          >
            {category.icon && (
              <span className="mr-1" aria-hidden="true">
                {category.icon}
              </span>
            )}
            {category.label}
            {category.count !== undefined && (
              <span className="ml-1 text-xs opacity-60">{category.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
