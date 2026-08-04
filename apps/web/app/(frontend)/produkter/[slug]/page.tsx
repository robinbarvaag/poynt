import { AdminBar } from "@/components/admin-bar";
import { JsonLd } from "@/components/json-ld";
import { ProductDetail } from "@/components/product-detail";
import { toProductGridItem } from "@/lib/product";
import { SITE_URL, buildMetadata, notFoundMetadata } from "@/lib/seo";
import { breadcrumbSchema, productSchema } from "@/lib/structured-data";
import config from "@/payload.config";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import { type Where, getPayload } from "payload";
import { Suspense } from "react";

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getProductPageData(slug: string) {
  "use cache";
  cacheTag("cms");
  cacheLife("minutes");

  const payload = await getPayload({ config });

  const productsResult = await payload.find({
    collection: "products",
    where: {
      slug: { equals: slug },
      active: { equals: true },
    },
    depth: 2,
    limit: 1,
  });

  const product = productsResult.docs[0];
  if (!product) return null;

  // «Andre produkter»: same kategori om mogleg, elles berre nyaste. Alltid
  // ekskluder produktet sjølv, og fall tilbake på nyaste om kategori-treffet er
  // tomt – slik at seksjonen aldri står tom på eit produkt utan kategori.
  const categoryIds = (product.categories ?? [])
    .map((c) => (typeof c === "object" ? c.id : c))
    .filter((id): id is number => typeof id === "number");

  const relatedWhere: Where = {
    active: { equals: true },
    id: { not_equals: product.id },
    ...(categoryIds.length > 0 && {
      categories: { in: categoryIds },
    }),
  };

  let related = await payload.find({
    collection: "products",
    where: relatedWhere,
    sort: "-createdAt",
    depth: 1,
    limit: 3,
  });

  if (related.docs.length === 0 && categoryIds.length > 0) {
    related = await payload.find({
      collection: "products",
      where: { active: { equals: true }, id: { not_equals: product.id } },
      sort: "-createdAt",
      depth: 1,
      limit: 3,
    });
  }

  return { product, related };
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProductPageData(slug);

  const product = data?.product;
  if (!product) {
    return notFoundMetadata("Produkt ikke funnet");
  }

  return buildMetadata({
    title: product.meta?.title || `${product.name} | Produkter`,
    description: product.meta?.description || product.shortDescription || "",
    path: `/produkter/${slug}`,
    image: product.meta?.image || product.featuredImage,
    noIndex: product.meta?.noIndex ?? undefined,
    canonicalUrl: product.meta?.canonicalUrl,
  });
}

// Alt innholdet avheng av `slug`, så params leses her – bak Suspense-grensa i
// default-exporten. Då kan Next servere eit umiddelbart skall (Instant
// Navigations med cacheComponents) og strøyme inn produktet.
async function ProductPageContent({ params }: ProductPageProps) {
  const { slug } = await params;
  const data = await getProductPageData(slug);

  if (!data) {
    notFound();
  }

  const { product, related } = data;
  const relatedProducts = related.docs.map(toProductGridItem);

  const productUrl = `${SITE_URL}/produkter/${slug}`;
  const jsonLd = [
    productSchema({
      name: product.name,
      description: product.shortDescription,
      image: product.featuredImage,
      url: productUrl,
      price: product.price,
    }),
    breadcrumbSchema([
      { name: "Hjem", url: SITE_URL },
      { name: "Produkter", url: `${SITE_URL}/produkter` },
      { name: product.name, url: productUrl },
    ]),
  ];

  return (
    <>
      <AdminBar
        collection="products"
        id={String(product.id)}
        singular="produkt"
      />
      <JsonLd data={jsonLd} />
      <ProductDetail product={product} relatedProducts={relatedProducts} />
    </>
  );
}

export default function ProductPage(props: ProductPageProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-7xl animate-pulse px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 h-5 w-56 rounded-full bg-muted" />
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-16">
            <div className="aspect-square w-full rounded-3xl bg-muted" />
            <div className="space-y-4">
              <div className="h-6 w-24 rounded-full bg-muted" />
              <div className="h-10 w-3/4 rounded-2xl bg-muted" />
              <div className="h-5 w-full rounded-full bg-muted" />
              <div className="h-5 w-2/3 rounded-full bg-muted" />
              <div className="h-12 w-40 rounded-2xl bg-muted" />
            </div>
          </div>
        </div>
      }
    >
      <ProductPageContent {...props} />
    </Suspense>
  );
}

export async function generateStaticParams() {
  const payload = await getPayload({ config });

  const products = await payload.find({
    collection: "products",
    where: {
      active: { equals: true },
    },
    limit: 1000,
  });

  return products.docs.map((product) => ({
    slug: product.slug,
  }));
}
