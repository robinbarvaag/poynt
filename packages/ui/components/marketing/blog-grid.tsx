import { cn } from "../../lib/utils";
import { BlogCard, type BlogCardProps, type BlogSurface } from "./blog-card";

export interface BlogGridItem extends BlogCardProps {
  id: string | number;
}

export interface BlogGridProps {
  posts: BlogGridItem[];
  /** Gjør det første innlegget fremhevet (2 kolonner). Default true. */
  featureFirst?: boolean;
  /**
   * Maks antall kolonner på desktop. Default 3 (2 på små skjermer).
   * Bruk 2 når du vet du har få innlegg, så kortene fyller bredden.
   */
  columns?: 2 | 3;
  className?: string;
}

// Roterende fargeblokk-tinter — blander lyse og mørke flater for magasin-rytme.
const palette: BlogSurface[] = ["saffron", "primary", "salmon", "mint"];

/**
 * Blogg-oversikt i fargeblokk-stil (PayPal/INSPO): hvert innlegg er et `Card` med
 * en roterende mettet flate, kategori-eyebrow, fet tittel, utdrag og forfatter/dato.
 * Innlegg uten bilde blir rene typografiske kort — den naturlige variasjonen gir
 * et redaksjonelt, magasinaktig rutenett. Uniformt grid med ett fremhevet innlegg.
 */
export function BlogGrid({
  posts,
  featureFirst = true,
  columns = 3,
  className,
}: BlogGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-5 sm:grid-cols-2",
        columns === 3 && "lg:grid-cols-3",
        className
      )}
    >
      {posts.map((post, index) => {
        const { id, featured, surface, ...rest } = post;
        return (
          <BlogCard
            key={id}
            {...rest}
            featured={featured ?? (featureFirst && index === 0)}
            surface={surface ?? palette[index % palette.length]}
          />
        );
      })}
    </div>
  );
}
