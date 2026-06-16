import config from "@/payload.config";
import { Heading } from "@poynt/ui";
import { getPayload } from "payload";
import type { ComponentProps } from "react";
import { ProductCard } from "../product-card";

interface ArchiveBlockProps {
  title?: string;
  populateBy: "selection" | "all";
  selectedProducts?: string[];
}

export async function ArchiveBlock({
  title,
  populateBy,
  selectedProducts,
}: ArchiveBlockProps) {
  const payload = await getPayload({ config });

  const products = await payload.find({
    collection: "products",
    where: {
      ...(populateBy === "selection" && selectedProducts
        ? {
            id: {
              in: selectedProducts,
            },
          }
        : {}),
      active: {
        equals: true,
      },
    },
  });

  return (
    <section className="py-8">
      {title && (
        <Heading size="h2" className="mb-6">
          {title}
        </Heading>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.docs.map((product) => (
          <ProductCard
            key={product.id}
            product={
              product as unknown as ComponentProps<
                typeof ProductCard
              >["product"]
            }
          />
        ))}
      </div>
    </section>
  );
}
