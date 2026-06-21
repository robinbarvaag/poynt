import { PageHero } from "@/components/page-hero";
import { ServiceExplorer } from "@/components/service-explorer";
import { buildMetadata } from "@/lib/seo";
import { toServiceExplorerItem } from "@/lib/service";
import config from "@/payload.config";
import { Container, Section, Text } from "@poynt/ui";
import type { Metadata } from "next";
import { getPayload } from "payload";

export async function generateMetadata(): Promise<Metadata> {
  const payload = await getPayload({ config });
  const pageConfig = await payload.findGlobal({ slug: "servicespage" });

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

  const heroEnabled = pageConfig?.hero?.enabled ?? true;
  const heroTitle = pageConfig?.hero?.title || "Tjenester";
  const heroDescription =
    pageConfig?.hero?.description || "Se hva vi kan hjelpe deg med";
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
    pageConfig?.emptyStateText || "Ingen tjenester tilgjengelig.";

  return (
    <>
      {heroEnabled && (
        <PageHero
          title={heroTitle}
          description={heroDescription}
          image={heroImage}
          size="large"
        />
      )}

      <Section variant="muted" spacing="md">
        <Container padding="none">
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
      </Section>
    </>
  );
}
