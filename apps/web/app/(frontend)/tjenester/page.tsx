import { AdminBar } from "@/components/admin-bar";
import { PageHero } from "@/components/page-hero";
import { ServiceExplorer } from "@/components/service-explorer";
import { buildMetadata } from "@/lib/seo";
import { toServiceExplorerItem } from "@/lib/service";
import config from "@/payload.config";
import { Container, Text } from "@poynt/ui";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { getPayload } from "payload";

async function getServicesPageData() {
  "use cache";
  cacheTag("cms");
  cacheLife("max");

  const payload = await getPayload({ config });

  const [pageConfig, services] = await Promise.all([
    payload.findGlobal({ slug: "servicespage" }),
    payload.find({
      collection: "services",
      where: {
        active: {
          equals: true,
        },
      },
      sort: "sortOrder",
      limit: 100,
    }),
  ]);

  return { pageConfig, services };
}

export async function generateMetadata(): Promise<Metadata> {
  const { pageConfig } = await getServicesPageData();

  const meta = pageConfig?.meta;
  return buildMetadata({
    title: meta?.title || "Tjenester",
    description: meta?.description || "Se alle tjenester vi tilbyr",
    path: "/tjenester",
    image: meta?.image,
    noIndex: meta?.noIndex ?? undefined,
  });
}

export default async function ServicesPage() {
  const { pageConfig, services } = await getServicesPageData();

  const heroEnabled = pageConfig?.hero?.enabled ?? true;
  const heroTitle = pageConfig?.hero?.title || "Tjenester";
  const heroDescription =
    pageConfig?.hero?.description || "Se hva vi kan hjelpe deg med";
  // Hele media-objektet sendes videre — PayloadImage håndterer url/alt/fokus.
  const heroImage =
    pageConfig?.hero?.image && typeof pageConfig.hero.image === "object"
      ? pageConfig.hero.image
      : null;
  const emptyStateText =
    pageConfig?.emptyStateText || "Ingen tjenester tilgjengelig.";

  return (
    <>
      <AdminBar global="servicespage" singular="tjenesteside" />
      {heroEnabled && (
        <PageHero
          title={heroTitle}
          description={heroDescription}
          image={heroImage}
          size="large"
        />
      )}

      {/* Innholdet ligger rett på sidens bakgrunn (som blogg/produkter) — en
          `muted`-Section her ga en hard grå-mot-grå-overgang mot PageHero-en
          og dobbel vertikal padding. */}
      <Container padding="default" className="py-8">
        {services.docs.length > 0 ? (
          <ServiceExplorer
            services={services.docs.map(toServiceExplorerItem)}
          />
        ) : (
          <Text variant="muted" customStyles="text-center py-12">
            {emptyStateText}
          </Text>
        )}
      </Container>
    </>
  );
}
