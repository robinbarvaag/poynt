import { toProductGridItem } from "@/lib/product";
import type { Product } from "@/payload-types";
import config from "@/payload.config";
import { BlockSection, Heading, ProductGrid } from "@poynt/ui";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { type Where, getPayload } from "payload";

interface ProductArchiveBlockProps {
  title?: string;
  description?: string;
  selectionMode?: "auto" | "manual";
  selectedProducts?: (string | Product)[];
  filterByType?: "all" | "course" | "pdf" | "bundle";
  limit?: number;
  layout?: "grid" | "grid-4" | "carousel";
  showMoreLink?: boolean;
}

export async function ProductArchiveBlock({
  title,
  description,
  selectionMode = "auto",
  selectedProducts,
  filterByType = "all",
  limit = 8,
  showMoreLink = false,
}: ProductArchiveBlockProps) {
  const payload = await getPayload({ config });

  let products: Product[] = [];

  if (selectionMode === "manual" && selectedProducts?.length) {
    // For manual selection, fetch the selected products by ID
    const productIds = selectedProducts.map((p) =>
      typeof p === "string" ? p : p.id
    );

    const result = await payload.find({
      collection: "products",
      where: {
        id: { in: productIds },
        active: { equals: true },
      },
      depth: 1,
      limit: 100,
    });

    // Preserve the order of selectedProducts
    products = productIds
      .map((id) => result.docs.find((doc) => doc.id === id))
      .filter((doc): doc is Product => !!doc);
  } else {
    // Auto mode - fetch based on filters
    const whereClause: Where = {
      active: {
        equals: true,
      },
    };

    if (filterByType !== "all") {
      whereClause.type = { equals: filterByType };
    }

    const result = await payload.find({
      collection: "products",
      where: whereClause,
      sort: "-createdAt",
      limit: limit || 100,
    });

    products = result.docs;
  }

  if (!products.length) {
    return null;
  }

  return (
    <BlockSection background="default" containerSize={false}>
      <div className="container mx-auto px-4">
        {(title || description) && (
          <div className="mb-8 md:mb-12">
            {title && (
              <Heading size="h2" customStyles="mb-3">
                {title}
              </Heading>
            )}
            {description && (
              <p className="max-w-2xl text-lg text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        )}

        <ProductGrid
          products={products.map(toProductGridItem)}
          featureFirst={false}
        />

        {showMoreLink && (
          <div className="mt-8 text-center">
            <Link
              href="/produkter"
              className="inline-flex items-center gap-2 font-medium text-primary hover:underline"
            >
              Se alle produkter
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </BlockSection>
  );
}
