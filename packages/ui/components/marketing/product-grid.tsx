import type * as React from "react";
import { cn } from "../../lib/utils";
import {
  type ProductAccent,
  ProductCard,
  type ProductCardProps,
} from "./product-card";

export interface ProductGridItem extends ProductCardProps {
  id: string | number;
}

export interface ProductGridProps {
  products: ProductGridItem[];
  /**
   * Gjør det første produktet til et fremhevet kort som spenner 2 kolonner.
   * Default true. Sett `featured` på et enkelt produkt for å overstyre hvilket.
   */
  featureFirst?: boolean;
  className?: string;
}

// Roterende aksentfarger for bloben bak bildet — gir liv på nøytrale kort
// uten å farge hele flaten.
const palette: ProductAccent[] = ["saffron", "salmon", "mint"];

/**
 * Produkt-rutenett: uniformt grid med ett fremhevet kort (2 kolonner) for
 * magasin-rytme. Kortene er nøytrale; fargen kommer som en roterende aksent i
 * bloben bak bildet, med mindre produktet selv oppgir `surface`/`accent`.
 * Presentasjons-only — mat den med ferdige props (appen kobler Payload-data og
 * `next/image` inn i `image`).
 */
export function ProductGrid({
  products,
  featureFirst = true,
  className,
}: ProductGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {products.map((product, index) => {
        const { id, featured, accent, ...rest } = product;
        return (
          <ProductCard
            key={id}
            {...rest}
            featured={featured ?? (featureFirst && index === 0)}
            accent={accent ?? palette[index % palette.length]}
          />
        );
      })}
    </div>
  );
}
