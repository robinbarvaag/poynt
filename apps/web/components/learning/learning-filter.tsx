"use client";

import { ContentFilterBar } from "@poynt/ui";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const OPTIONS = [
  { value: "alt", label: "Alt" },
  { value: "guide", label: "Guider", icon: "compass" as const },
  { value: "kurs", label: "Kurs", icon: "graduation-cap" as const },
];

/**
 * Format-filter for Læring-huben. Bruker URL-param (`?type=`) så server-siden
 * kan filtrere den sammenslåtte lista.
 */
export function LearningFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const value = searchParams.get("type") ?? "alt";

  const onChange = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "alt") {
        params.delete("type");
      } else {
        params.set("type", next);
      }
      const query = params.toString();
      router.push(query ? `?${query}` : "?", { scroll: false });
    },
    [router, searchParams]
  );

  return (
    <ContentFilterBar options={OPTIONS} value={value} onChange={onChange} />
  );
}
