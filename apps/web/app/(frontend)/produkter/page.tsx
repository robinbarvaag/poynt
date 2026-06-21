import { CategoryFilter } from "@/components/category-filter";
import { PageHero } from "@/components/page-hero";
import { PRODUCT_TYPE_FILTERS, toProductGridItem } from "@/lib/product";
import { buildMetadata } from "@/lib/seo";
import config from "@/payload.config";
import { Container, ProductGrid, Text } from "@poynt/ui";
import type { Metadata } from "next";
import { getPayload } from "payload";

export async function generateMetadata(): Promise<Metadata> {
  const payload = await getPayload({ config });
  const pageConfig = await payload.findGlobal({ slug: "productspage" });

  const meta = pageConfig?.meta;
  return buildMetadata({
    title: meta?.title || "Produkter | Poynt",
    description: meta?.description || "Utforsk våre digitale produkter",
    path: "/produkter",
    image: meta?.image,
    noIndex: meta?.noIndex ?? undefined,
  });
}

interface PageProps {
  searchParams: Promise<{ type?: string }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const { type } = await searchParams;
  const payload = await getPayload({ config });

  const [pageConfig, products] = await Promise.all([
    payload.findGlobal({ slug: "productspage" }),
    payload.find({
      collection: "products",
      where: {
        active: { equals: true },
        ...(type && { type: { equals: type } }),
      },
      sort: "-createdAt",
      limit: 100,
    }),
  ]);

  const heroEnabled = pageConfig?.hero?.enabled ?? true;
  const heroTitle = pageConfig?.hero?.title || "Produkter";
  const heroDescription =
    pageConfig?.hero?.description || "Utforsk våre digitale produkter";
  const heroImage =
    pageConfig?.hero?.image &&
    typeof pageConfig.hero.image === "object" &&
    pageConfig.hero.image.url
      ? {
          url: pageConfig.hero.image.url,
          alt: pageConfig.hero.image.alt ?? undefined,
        }
      : null;
  const emptyStateText =
    pageConfig?.emptyStateText || "Ingen produkter tilgjengelig.";

  return (
    <>
      {heroEnabled && (
        <PageHero
          eyebrow="Nettbutikk"
          title={heroTitle}
          description={heroDescription}
          size="large"
        >
          <CategoryFilter
            categories={PRODUCT_TYPE_FILTERS}
            paramName="type"
            allLabel="Alle"
          />
        </PageHero>
      )}

      <Container padding="default" className="py-8">
        {products.docs.length > 0 ? (
          <ProductGrid products={products.docs.map(toProductGridItem)} />
        ) : (
          <Text variant="muted" customStyles="text-center py-12">
            {emptyStateText}
          </Text>
        )}
      </Container>
    </>
  );
}
