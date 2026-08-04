import { toProductGridItem } from "@/lib/product";
import type { Product } from "@/payload-types";
import config from "@/payload.config";
import { BlockSection, Container, ProductGrid, SectionHeader } from "@poynt/ui";
import { ArrowRight } from "lucide-react";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { type Where, getPayload } from "payload";

interface ProductArchiveBlockProps {
  title?: string;
  description?: string;
  selectionMode?: "auto" | "manual";
  selectedProducts?: (string | Product)[];
  filterByType?: "all" | "course" | "pdf" | "bundle";
  limit?: number;
  showMoreLink?: boolean;
}

/**
 * Cachet datahenting med KUN skalarer som argumenter. `selectedProducts` fra
 * Payload er hele dokumenter — brukes de som cache-nøkkel blir hver felt-
 * endring en ny nøkkel (null treff, ubegrenset vekst). Derfor mappes de til
 * id-er FØR den cachede grensen.
 */
async function fetchArchiveProducts(
  productIds: (string | number)[],
  filterByType: "all" | "course" | "pdf" | "bundle",
  limit: number
): Promise<Product[]> {
  "use cache";
  cacheTag("cms");
  cacheLife("minutes");

  const payload = await getPayload({ config });

  if (productIds.length > 0) {
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
    return productIds
      .map((id) => result.docs.find((doc) => doc.id === id))
      .filter((doc): doc is Product => !!doc);
  }

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

  return result.docs;
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
  const productIds =
    selectionMode === "manual" && selectedProducts?.length
      ? selectedProducts.map((p) => (typeof p === "string" ? p : p.id))
      : [];

  const products = await fetchArchiveProducts(productIds, filterByType, limit);

  if (!products.length) {
    return null;
  }

  return (
    <BlockSection background="default" containerSize={false}>
      <Container padding="none">
        <SectionHeader title={title} intro={description} reveal={false} />

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
      </Container>
    </BlockSection>
  );
}
