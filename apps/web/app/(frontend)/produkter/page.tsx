import config from "@/payload.config";
import { PageHero } from "@/components/page-hero";
import { ProductCard } from "@/components/product-card";
import { Container } from "@poynt/ui";
import type { Metadata } from "next";
import { getPayload } from "payload";

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

export default async function ProductsPage() {
  const payload = await getPayload({ config });

  const [pageConfig, products] = await Promise.all([
    payload.findGlobal({ slug: "productspage" }),
    payload.find({
      collection: "products",
      where: {
        active: {
          equals: true,
        },
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
    pageConfig?.hero?.image && typeof pageConfig.hero.image === "object" && pageConfig.hero.image.url
      ? { url: pageConfig.hero.image.url, alt: pageConfig.hero.image.alt ?? undefined }
      : null;
  const emptyStateText =
    pageConfig?.emptyStateText || "Ingen produkter tilgjengelig.";

  return (
    <>
      {heroEnabled && (
        <PageHero
          title={heroTitle}
          description={heroDescription}
          image={heroImage}
        />
      )}

      <Container padding="lg" className={heroEnabled ? "pt-0" : ""}>
        {products.docs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.docs.map((product) => (
              <ProductCard key={product.id} product={product as any} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center">{emptyStateText}</p>
        )}
      </Container>
    </>
  );
}
