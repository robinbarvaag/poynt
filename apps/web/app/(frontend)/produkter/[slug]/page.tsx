import config from "@/payload.config";
import { notFound } from "next/navigation";
import { getPayload } from "payload";
import type { Metadata } from "next";
import { ProductDetailClient } from "@/components/product-detail";

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

  if (products.docs.length === 0) {
    return { title: "Produkt ikke funnet" };
  }

  const product = products.docs[0];
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

  return {
    title: `${product.name} | Produkter | Poynt`,
    description: product.shortDescription || "",
    alternates: {
      canonical: `${baseUrl}/produkter/${slug}`,
    },
    openGraph: {
      title: product.name,
      description: product.shortDescription || "",
      url: `${baseUrl}/produkter/${slug}`,
      type: "website",
      ...(product.featuredImage &&
        typeof product.featuredImage === "object" &&
        product.featuredImage.url && {
          images: [{ url: product.featuredImage.url }],
        }),
    },
  };
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

  return <ProductDetailClient product={product} benefits={productBenefits} />;
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
