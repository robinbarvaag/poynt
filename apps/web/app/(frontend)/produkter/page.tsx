import { CategoryFilter } from "@/components/category-filter";
import { PageHero } from "@/components/page-hero";
import { ProductCard } from "@/components/product-card";
import config from "@/payload.config";
import { Container, Text } from "@poynt/ui";
import type { Metadata } from "next";
import { getPayload } from "payload";
import type { ComponentProps } from "react";

type ProductCardData = ComponentProps<typeof ProductCard>["product"];

const productTypes = [
  { value: "course", label: "Kurs" },
  { value: "pdf", label: "PDF" },
  { value: "bundle", label: "Pakker" },
];

export async function generateMetadata(): Promise<Metadata> {
  const payload = await getPayload({ config });
  const pageConfig = await payload.findGlobal({ slug: "productspage" });

  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

  return {
    title: pageConfig?.meta?.title || "Produkter | Poynt",
    description:
      pageConfig?.meta?.description || "Utforsk våre digitale produkter",
    alternates: {
      canonical: `${baseUrl}/produkter`,
    },
    openGraph: {
      title: pageConfig?.meta?.title || "Produkter | Poynt",
      description:
        pageConfig?.meta?.description || "Utforsk våre digitale produkter",
      url: `${baseUrl}/produkter`,
      type: "website",
      ...(pageConfig?.meta?.image &&
        typeof pageConfig.meta.image === "object" &&
        pageConfig.meta.image.url && {
          images: [{ url: pageConfig.meta.image.url }],
        }),
    },
    ...(pageConfig?.meta?.noIndex && {
      robots: { index: false, follow: false },
    }),
  };
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
        <PageHero title={heroTitle} description={heroDescription} size="large">
          <CategoryFilter
            categories={productTypes}
            paramName="type"
            allLabel="Alle"
          />
        </PageHero>
      )}

      <Container padding="default" className="py-8">
        {products.docs.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
            {products.docs.map((product) => (
              <ProductCard
                key={product.id}
                product={product as unknown as ProductCardData}
              />
            ))}
          </div>
        ) : (
          <Text variant="muted" className="text-center py-12">
            {emptyStateText}
          </Text>
        )}
      </Container>
    </>
  );
}
