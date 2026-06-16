import { getMediaUrl } from "@/lib/media-url";
import { Heading, Text } from "@poynt/ui";
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
  const priceInKr = product.price.toLocaleString("nb-NO");
  const compareAtPriceInKr = product.compareAtPrice
    ? product.compareAtPrice.toLocaleString("nb-NO")
    : null;

  const hasDiscount =
    product.compareAtPrice != null && product.compareAtPrice > product.price;

  const productImage = product.featuredImage || product.image;

  return (
    <Link href={`/produkter/${product.slug}`} className="group block">
      <div className="relative mb-4 aspect-4/3 overflow-hidden rounded-2xl bg-muted">
        {productImage ? (
          <Image
            src={getMediaUrl(productImage.url)}
            alt={productImage.alt || product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted-foreground/10">
              <span className="text-lg text-muted-foreground/40">
                {typeLabels[product.type]?.[0] || "P"}
              </span>
            </div>
          </div>
        )}

        {hasDiscount && (
          <span className="absolute top-3 right-3 rounded-full bg-saffron px-3 py-1 font-semibold text-foreground text-xs">
            Tilbud
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        <Text
          type="span"
          customStyles="font-heading font-semibold text-primary text-xs uppercase tracking-[0.18em]"
        >
          {typeLabels[product.type] || product.type}
        </Text>

        <Heading
          variant="h4"
          color="foreground"
          weight="bold"
          customStyles="line-clamp-2 leading-snug transition-colors group-hover:text-primary"
        >
          {product.name}
        </Heading>

        {product.shortDescription && (
          <Text variant="muted" customStyles="line-clamp-1">
            {product.shortDescription}
          </Text>
        )}

        <div className="flex items-baseline gap-2 pt-1">
          <Text type="span" customStyles="font-semibold text-foreground">
            {priceInKr} kr
          </Text>
          {hasDiscount && (
            <Text type="span" variant="muted" customStyles="line-through">
              {compareAtPriceInKr} kr
            </Text>
          )}
        </div>
      </div>
    </Link>
  );
}
