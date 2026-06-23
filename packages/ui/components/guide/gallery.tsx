"use client";

import type * as React from "react";
import { cn } from "../../lib/utils";
import { Stagger, StaggerItem } from "../motion/reveal";

export interface GalleryItem {
  /** Bilde-node (typisk et <Image>). */
  node: React.ReactNode;
  caption?: string;
}

export interface GalleryProps {
  items: GalleryItem[];
  layout?: "grid" | "carousel";
  /** Samlet bildetekst under galleriet. */
  caption?: string;
  className?: string;
}

function Figure({ item }: { item: GalleryItem }) {
  return (
    <figure className="group/figure overflow-hidden rounded-2xl bg-muted/40 ring-1 ring-foreground/10">
      <div className="relative aspect-[4/5] overflow-hidden *:[img]:h-full *:[img]:w-full *:[img]:object-cover *:[img]:transition-transform *:[img]:duration-500 group-hover/figure:*:[img]:scale-105">
        {item.node}
      </div>
      {item.caption && (
        <figcaption className="px-3 py-2 text-current/70 text-sm">
          {item.caption}
        </figcaption>
      )}
    </figure>
  );
}

/**
 * Bildegalleri som rutenett eller horisontal karusell (scroll-snap). Bildene
 * glir inn forskjøvet og zoomer mildt på hover.
 */
export function Gallery({
  items,
  layout = "grid",
  caption,
  className,
}: GalleryProps) {
  if (layout === "carousel") {
    return (
      <div className={cn("flex flex-col gap-3", className)}>
        <div className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
          {items.map((item, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: statisk bilde-liste uten stabil id
            <div key={i} className="w-64 shrink-0 snap-start sm:w-72">
              <Figure item={item} />
            </div>
          ))}
        </div>
        {caption && (
          <p className="text-center text-current/70 text-sm">{caption}</p>
        )}
      </div>
    );
  }

  const cols =
    items.length >= 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2";

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <Stagger className={cn("grid grid-cols-1 gap-4", cols)}>
        {items.map((item, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: statisk bilde-liste uten stabil id
          <StaggerItem key={i}>
            <Figure item={item} />
          </StaggerItem>
        ))}
      </Stagger>
      {caption && (
        <p className="text-center text-current/70 text-sm">{caption}</p>
      )}
    </div>
  );
}
