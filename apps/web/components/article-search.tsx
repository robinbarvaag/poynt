"use client";

import { Input } from "@poynt/ui";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef } from "react";

export function ArticleSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.get("sok") || "";
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleSearch = useCallback(
    (value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
          params.set("sok", value);
        } else {
          params.delete("sok");
        }
        router.push(`?${params.toString()}`, { scroll: false });
      }, 300);
    },
    [router, searchParams]
  );

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Søk i artiklar..."
        defaultValue={currentSearch}
        onChange={(e) => handleSearch(e.target.value)}
        className="pl-9"
      />
    </div>
  );
}
