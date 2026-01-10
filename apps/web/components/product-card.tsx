import Image from "next/image";
import Link from "next/link";
import { Button } from "@poynt/ui";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  type: string;
  image?: {
    url: string;
    alt?: string;
  };
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const priceInKr = (product.price / 100).toFixed(2);

  return (
    <Link
      href={`/kurs/${product.slug}`}
      className="group block border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
    >
      {product.image && (
        <div className="relative aspect-video w-full bg-muted">
          <Image
            src={product.image.url}
            alt={product.image.alt || product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform"
          />
        </div>
      )}
      <div className="p-4">
        <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
        <p className="text-2xl font-bold text-primary">{priceInKr} kr</p>
        <Button className="w-full mt-4" variant="outline">
          Les meir
        </Button>
      </div>
    </Link>
  );
}
