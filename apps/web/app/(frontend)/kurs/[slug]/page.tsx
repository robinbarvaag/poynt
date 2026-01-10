import { notFound } from "next/navigation";
import { getPayload } from "payload";
import config from "@/payload.config";
import Image from "next/image";
import { AddToCartButton } from "@/components/add-to-cart-button";

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const payload = await getPayload({ config });

  const products = await payload.find({
    collection: "products",
    where: {
      slug: {
        equals: slug,
      },
      active: {
        equals: true,
      },
    },
    limit: 1,
  });

  if (products.docs.length === 0) {
    notFound();
  }

  const product = products.docs[0];
  const priceInKr = (product.price / 100).toFixed(2);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {product.image && typeof product.image === "object" && (
          <div className="relative aspect-square w-full rounded-lg overflow-hidden">
            <Image
              src={product.image.url}
              alt={product.image.alt || product.name}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div>
          <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
          <p className="text-3xl font-bold text-primary mb-6">{priceInKr} kr</p>
          <AddToCartButton product={product as any} />
        </div>
      </div>
      {product.description && (
        <div className="prose prose-lg max-w-none">
          <h2>Om kurset</h2>
          {/* TODO: Render Lexical richText */}
          <p className="text-muted-foreground">
            [Produktbeskriving vil bli rendera her]
          </p>
        </div>
      )}
    </div>
  );
}

export async function generateStaticParams() {
  const payload = await getPayload({ config });

  const products = await payload.find({
    collection: "products",
    where: {
      active: {
        equals: true,
      },
    },
    limit: 1000,
  });

  return products.docs.map((product) => ({
    slug: product.slug,
  }));
}
