import { AdminBar } from "@/components/admin-bar";
import { PageHero } from "@/components/page-hero";
import {
  ProductExplorer,
  type ProductExplorerItem,
} from "@/components/product-explorer";
import { PRODUCT_TYPE_FILTERS, toProductGridItem } from "@/lib/product";
import { buildMetadata } from "@/lib/seo";
import { isAdminViewer, notTestProduct } from "@/lib/test-products";
import config from "@/payload.config";
import { Container, ProductGrid } from "@poynt/ui";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { getPayload } from "payload";
import { Suspense } from "react";

async function getProductsPageData() {
  "use cache";
  cacheTag("cms");
  cacheLife("max");

  const payload = await getPayload({ config });

  const [pageConfig, products] = await Promise.all([
    payload.findGlobal({ slug: "productspage" }),
    payload.find({
      collection: "products",
      where: {
        active: { equals: true },
        ...notTestProduct,
      },
      // Manuell rekkefølge først (lavest displayOrder → først, tomme sist),
      // deretter nyeste først som fallback.
      sort: ["displayOrder", "-createdAt"],
      limit: 100,
    }),
  ]);

  return { pageConfig, products };
}

/**
 * Testprodukter for innloggede. Hentes utenfor «use cache» fordi svaret er
 * avhengig av innloggingscookien — resten av oversikten er fortsatt cachet
 * og delt av alle.
 */
async function TestProductsSection() {
  if (!(await isAdminViewer())) return null;

  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "products",
    where: { testProduct: { equals: true } },
    sort: ["displayOrder", "-createdAt"],
    limit: 50,
  });

  if (result.docs.length === 0) return null;

  return (
    <Container padding="default" className="pb-12">
      <div className="rounded-3xl border border-amber-300 border-dashed bg-amber-50/60 p-6 dark:bg-amber-950/20">
        <p className="mb-4 font-medium text-amber-900 text-sm dark:text-amber-200">
          Testprodukter — kun synlig for deg som er logget inn i admin.
        </p>
        <ProductGrid
          products={result.docs.map(toProductGridItem)}
          featureFirst={false}
        />
      </div>
    </Container>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const { pageConfig } = await getProductsPageData();

  const meta = pageConfig?.meta;
  return buildMetadata({
    title: meta?.title || "Produkter",
    description: meta?.description || "Utforsk våre digitale produkter",
    path: "/produkter",
    image: meta?.image,
    noIndex: meta?.noIndex ?? undefined,
  });
}

export default async function ProductsPage() {
  const { pageConfig, products } = await getProductsPageData();

  const heroEnabled = pageConfig?.hero?.enabled ?? true;
  const heroTitle = pageConfig?.hero?.title || "Produkter";
  const heroDescription =
    pageConfig?.hero?.description || "Utforsk våre digitale produkter";
  // Hele media-objektet sendes videre — PayloadImage håndterer url/alt/fokus.
  const heroImage =
    pageConfig?.hero?.image && typeof pageConfig.hero.image === "object"
      ? pageConfig.hero.image
      : null;
  const emptyStateText =
    pageConfig?.emptyStateText || "Ingen produkter tilgjengelig.";

  // Samme mønster som bloggen: filter + søk skjer på klienten over hele
  // lista, plassert over gridet — ikke URL-param-filter inne i heroen.
  const items: ProductExplorerItem[] = products.docs.map((product) => ({
    ...toProductGridItem(product),
    type: product.type,
    search: [product.name, product.shortDescription]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
  }));

  // Vis kun filterpiller for typer som faktisk finnes i sortimentet.
  const presentTypes = new Set(items.map((item) => item.type));
  const filters = PRODUCT_TYPE_FILTERS.filter((f) => presentTypes.has(f.value));

  return (
    <>
      <AdminBar global="productspage" singular="produktside" />
      {heroEnabled && (
        <PageHero
          eyebrow="Nettbutikk"
          title={heroTitle}
          description={heroDescription}
          image={heroImage}
          size="large"
        />
      )}

      <Container padding="default" className="py-8">
        <ProductExplorer
          products={items}
          filters={filters}
          emptyStateText={emptyStateText}
        />
      </Container>

      <Suspense fallback={null}>
        <TestProductsSection />
      </Suspense>
    </>
  );
}
