import { toProductGridItem } from "@/lib/product";
import { notTestProduct } from "@/lib/test-products";
import type { Product } from "@/payload-types";
import config from "@/payload.config";
import {
  BlockSection,
  Container,
  ProductCarousel,
  ProductGrid,
  SectionHeader,
} from "@poynt/ui";
import { ArrowRight } from "lucide-react";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { type Where, getPayload } from "payload";

type ProductTypeFilter = "all" | "product" | "course" | "pdf" | "bundle";

type ProductRef = number | string | Product;

interface ProductArchiveBlockProps {
  title?: string;
  description?: string;
  selectionMode?: "auto" | "manual";
  selectedProducts?: ProductRef[] | null;
  featuredProduct?: ProductRef | null;
  filterByType?: ProductTypeFilter;
  limit?: number | null;
  /** Rutenett (standard) eller sveipbar rad. */
  layout?: "grid" | "carousel" | null;
  featureFirst?: boolean | null;
  showMoreLink?: boolean | null;
}

/**
 * Payload-id-er er tall i dette prosjektet, men en relasjon kan komme som
 * tall, streng eller fullt dokument avhengig av `depth`. Én løser for alle.
 */
function toProductId(ref: ProductRef | null | undefined): number | null {
  if (ref == null) return null;
  if (typeof ref === "object") return ref.id;
  const id = typeof ref === "string" ? Number(ref) : ref;
  return Number.isFinite(id) ? id : null;
}

/**
 * Cachet datahenting med KUN skalarer som argumenter. `selectedProducts` fra
 * Payload er hele dokumenter — brukes de som cache-nøkkel blir hver felt-
 * endring en ny nøkkel (null treff, ubegrenset vekst). Derfor mappes de til
 * id-er FØR den cachede grensen.
 */
async function fetchArchiveProducts(
  productIds: number[],
  filterByType: ProductTypeFilter,
  limit: number
): Promise<Product[]> {
  "use cache";
  cacheTag("cms");
  cacheLife("max");

  const payload = await getPayload({ config });

  if (productIds.length > 0) {
    const result = await payload.find({
      collection: "products",
      where: {
        id: { in: productIds },
        active: { equals: true },
        ...notTestProduct,
      },
      depth: 1,
      limit: 100,
    });

    // Behold rekkefølgen fra redaktørens utvalg.
    return productIds
      .map((id) => result.docs.find((doc) => doc.id === id))
      .filter((doc): doc is Product => !!doc);
  }

  const whereClause: Where = {
    active: {
      equals: true,
    },
    ...notTestProduct,
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
  featuredProduct,
  filterByType = "all",
  limit,
  layout,
  featureFirst,
  showMoreLink,
}: ProductArchiveBlockProps) {
  const isManual = selectionMode === "manual";

  const featuredId = isManual ? toProductId(featuredProduct) : null;

  // Fremhevet produkt legges alltid først; dupliseres ikke om det også ligger
  // i utvalget. Tom manuell liste faller tilbake til automatisk visning.
  const manualIds = isManual
    ? (selectedProducts ?? [])
        .map(toProductId)
        .filter((id): id is number => id != null && id !== featuredId)
    : [];
  const productIds =
    featuredId != null ? [featuredId, ...manualIds] : manualIds;

  const products = await fetchArchiveProducts(
    productIds,
    filterByType,
    limit ?? 8
  );

  if (!products.length) {
    return null;
  }

  const items = products.map((product) => ({
    ...toProductGridItem(product),
    // Manuelt: kun det valgte produktet fremheves. Automatisk: første kort
    // hvis redaktøren har skrudd det på.
    ...(isManual ? { featured: product.id === featuredId } : {}),
  }));

  if (layout === "carousel") {
    // Karusellen har ikke plass til et fremhevet kort — alle kort like store
    // (ProductCarousel ignorerer `featured`).
    return (
      <BlockSection background="default" containerSize={false}>
        <Container padding="none">
          <ProductCarousel
            products={items}
            label={title ?? "Produkter"}
            header={
              <SectionHeader
                title={title}
                intro={description}
                reveal={false}
                className="mb-0"
              />
            }
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

  return (
    <BlockSection background="default" containerSize={false}>
      <Container padding="none">
        <SectionHeader title={title} intro={description} reveal={false} />

        <ProductGrid
          products={items}
          featureFirst={!isManual && Boolean(featureFirst)}
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
