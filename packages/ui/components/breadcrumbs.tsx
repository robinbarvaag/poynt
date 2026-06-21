import { ChevronRight } from "lucide-react";
import * as React from "react";
import { cn } from "../lib/utils";

export interface BreadcrumbItem {
  label: string;
  /** Utelat på siste ledd (gjeldende side). */
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Brødsmulesti for detaljsider, f.eks. «Hjem / Blogg / Tittel». Rammeverk-lett:
 * bruker `<a href>` (som kortene), så den funker i både server- og klient-sider.
 * Siste ledd vises uten lenke og merkes `aria-current="page"`.
 */
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Brødsmuler" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-muted-foreground text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li
              key={item.href ?? item.label}
              className="flex items-center gap-1.5"
            >
              {item.href && !isLast ? (
                <a
                  href={item.href}
                  className="transition-colors hover:text-foreground"
                >
                  {item.label}
                </a>
              ) : (
                <span
                  className={cn(isLast && "font-medium text-foreground")}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
              {!isLast && (
                <ChevronRight
                  aria-hidden="true"
                  className="size-3.5 opacity-60"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
