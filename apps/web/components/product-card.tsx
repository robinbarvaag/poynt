import { getMediaUrl } from "@/lib/media-url";
import { Badge, Button, cn } from "@poynt/ui";
import Image from "next/image";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  type: "course" | "pdf" | "bundle";
  featuredImage?: {
    url: string;
    alt?: string;
  };
  // Legacy support
  image?: {
    url: string;
    alt?: string;
  };
}

interface ProductCardProps {
  product: Product;
}

const typeLabels: Record<string, string> = {
  course: "Kurs",
  pdf: "PDF",
  bundle: "Bundle",
};

export function ProductCard({ product }: ProductCardProps) {
  const priceInKr = (product.price / 100).toLocaleString("nb-NO");
  const compareAtPriceInKr = product.compareAtPrice
    ? (product.compareAtPrice / 100).toLocaleString("nb-NO")
    : null;

  const hasDiscount = compareAtPriceInKr && product.compareAtPrice! > product.price;

  // Support both new schema (featuredImage) and old schema (image)
  const productImage = product.featuredImage || product.image;

  return (
    <Link
      href={`/produkter/${product.slug}`}
      className="group flex flex-col bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all"
    >
      <div className="relative aspect-[4/3] w-full bg-muted">
        {productImage ? (
          <Image
            src={getMediaUrl(productImage.url)}
            alt={productImage.alt || product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/5">
            <span className="text-4xl">📦</span>
          </div>
        )}

        {/* Type badge */}
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
            {typeLabels[product.type] || product.type}
          </Badge>
        </div>

        {/* Discount badge */}
        {hasDiscount && (
          <div className="absolute top-3 right-3">
            <Badge variant="destructive">Tilbud</Badge>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-4">
        <h3 className="font-semibold text-lg mb-1 line-clamp-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {product.shortDescription && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {product.shortDescription}
          </p>
        )}

        <div className="mt-auto pt-3 border-t border-border">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-primary">{priceInKr} kr</span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                {compareAtPriceInKr} kr
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
