import { ProductDetailClient } from "@/components/product-detail";
import { toProductGridItem } from "@/lib/product";
import { buildMetadata, notFoundMetadata } from "@/lib/seo";
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
    title: `${product.name} | Produkter | Poynt`,
    description: product.shortDescription ?? undefined,
    path: `/produkter/${slug}`,
    image: product.featuredImage,
  });
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const payload = await getPayload({ config });

  const [productsResult, productSettings] = await Promise.all([
    payload.find({
      collection: "products",
      where: {
        slug: { equals: slug },
        active: { equals: true },
      },
      depth: 2,
      limit: 1,
    }),
    payload.findGlobal({ slug: "productSettings" }),
  ]);

  if (productsResult.docs.length === 0) {
    notFound();
  }

  const product = productsResult.docs[0];

  // Get the benefit labels for the product's selected benefit keys
  const allBenefits = productSettings?.benefits || [];
  const productBenefitKeys = (product.benefits as string[] | null) || [];
  const productBenefits = productBenefitKeys
    .map((key) => allBenefits.find((b) => b.key === key)?.label)
    .filter((label): label is string => !!label);

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

  return (
    <ProductDetailClient
      product={product}
      benefits={productBenefits}
      relatedProducts={relatedProducts}
    />
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
