import { JsonLd } from "@/components/json-ld";
import { ProductDetailClient } from "@/components/product-detail";
import { toProductGridItem } from "@/lib/product";
import { SITE_URL, buildMetadata, notFoundMetadata } from "@/lib/seo";
import { breadcrumbSchema, productSchema } from "@/lib/structured-data";
import config from "@/payload.config";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { type Where, getPayload } from "payload";

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const payload = await getPayload({ config });

  const products = await payload.find({
    collection: "products",
    where: {
      slug: { equals: slug },
      active: { equals: true },
    },
    limit: 1,
  });

  const product = products.docs[0];
  if (!product) {
    return notFoundMetadata("Produkt ikke funnet");
  }

  return buildMetadata({
    title: product.meta?.title || `${product.name} | Produkter`,
    description: product.meta?.description || product.shortDescription || "",
    path: `/produkter/${slug}`,
    image: product.meta?.image || product.featuredImage,
  });
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
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

  if (productsResult.docs.length === 0) {
    notFound();
  }

  const product = productsResult.docs[0];

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
      <JsonLd data={jsonLd} />
      <ProductDetailClient
        product={product}
        relatedProducts={relatedProducts}
      />
    </>
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
