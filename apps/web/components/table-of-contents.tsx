"use client";

import type { TocItem } from "@/lib/extract-toc";
import { cn } from "@poynt/ui";
import { useEffect, useState } from "react";

interface TableOfContentsProps {
  items: TocItem[];
}

export function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -80% 0px" }
    );

    for (const item of items) {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    }

    return () => observer.disconnect();
  }, [items]);

  if (items.length < 2) return null;

  return (
    <nav aria-label="Innhaldsoversikt" className="space-y-1">
      <p className="text-sm font-medium mb-3">Innhald</p>
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className={cn(
            "block text-sm py-1 transition-colors hover:text-foreground",
            item.level === 3 && "pl-4",
            activeId === item.id
              ? "text-primary font-medium"
              : "text-muted-foreground"
          )}
          onClick={(e) => {
            e.preventDefault();
            document.getElementById(item.id)?.scrollIntoView({
              behavior: "smooth",
            });
          }}
        >
          {item.text}
        </a>
      ))}
    </nav>
  );
}
