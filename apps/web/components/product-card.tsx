import { getMediaUrl } from "@/lib/media-url";
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
  bundle: "Pakke",
};

export function ProductCard({ product }: ProductCardProps) {
  const priceInKr = (product.price / 100).toLocaleString("nb-NO");
  const compareAtPriceInKr = product.compareAtPrice
    ? (product.compareAtPrice / 100).toLocaleString("nb-NO")
    : null;

  const hasDiscount =
    compareAtPriceInKr && product.compareAtPrice! > product.price;

  const productImage = product.featuredImage || product.image;

  return (
    <Link href={`/produkter/${product.slug}`} className="group block">
      <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted mb-3">
        {productImage ? (
          <Image
            src={getMediaUrl(productImage.url)}
            alt={productImage.alt || product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-muted-foreground/10 flex items-center justify-center">
              <span className="text-muted-foreground/40 text-lg">
                {typeLabels[product.type]?.[0] || "P"}
              </span>
            </div>
          </div>
        )}

        {hasDiscount && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-0.5 text-xs font-medium bg-foreground text-background rounded">
              Tilbud
            </span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">
            {typeLabels[product.type] || product.type}
          </span>
        </div>

        <h3 className="font-medium leading-snug group-hover:text-primary transition-colors line-clamp-2">
          {product.name}
        </h3>

        {product.shortDescription && (
          <p className="text-sm text-muted-foreground line-clamp-1">
            {product.shortDescription}
          </p>
        )}

        <div className="flex items-baseline gap-2 pt-1">
          <span className="font-semibold">{priceInKr} kr</span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">
              {compareAtPriceInKr} kr
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
