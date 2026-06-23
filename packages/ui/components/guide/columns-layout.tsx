"use client";

import type * as React from "react";
import { cn } from "../../lib/utils";
import { Stagger, StaggerItem } from "../motion/reveal";

export interface ColumnsLayoutProps {
  /** Hver kolonne som ferdig-rendret node (tekst eller bilde). */
  columns: React.ReactNode[];
  align?: "top" | "center";
  className?: string;
}

const colsClass: Record<number, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
};

/**
 * To eller flere kolonner side ved side på desktop, stablet på mobil. Hver
 * kolonne glir inn forskjøvet via Stagger.
 */
export function ColumnsLayout({
  columns,
  align = "top",
  className,
}: ColumnsLayoutProps) {
  const count = Math.min(Math.max(columns.length, 1), 4);
  return (
    <Stagger
      className={cn(
        "grid grid-cols-1 gap-6 md:gap-8",
        colsClass[count],
        align === "center" ? "items-center" : "items-start",
        className
      )}
    >
      {columns.map((col, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: statisk liste av generiske noder uten stabil id
        <StaggerItem key={i} className="min-w-0">
          {col}
        </StaggerItem>
      ))}
    </Stagger>
  );
}
