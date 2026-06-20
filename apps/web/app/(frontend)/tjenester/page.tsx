import { PageHero } from "@/components/page-hero";
import {
  ServiceExplorer,
  type ServiceExplorerItem,
} from "@/components/service-explorer";
import type { Service } from "@/payload-types";
import config from "@/payload.config";
import { Container, Section, Text } from "@poynt/ui";
import type { Metadata } from "next";
import { getPayload } from "payload";

function formatServicePrice(service: Service): string | undefined {
  if (service.priceType === "contact") {
    return "Ta kontakt for pris";
  }
  if (!service.price) {
    return undefined;
  }
  const price = service.price.toLocaleString("nb-NO");
  const vat = service.includesVat ? " + mva" : "";
  switch (service.priceType) {
    case "from":
      return `Fra ${price} kr${vat}`;
    case "monthly":
      return `${price} kr${vat} / mnd`;
    default:
      return `${price} kr${vat}`;
  }
}

function toExplorerItem(service: Service): ServiceExplorerItem {
  const media =
    service.image && typeof service.image !== "number" ? service.image : null;

  return {
    id: service.id,
    name: service.name,
    price: formatServicePrice(service),
    description: service.shortDescription,
    eyebrow: "Tjeneste",
    ctaLabel: service.ctaText || "Ta kontakt",
    ctaHref: service.ctaLink || "/kontakt",
    image: media ?? undefined,
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const payload = await getPayload({ config });
  const pageConfig = await payload.findGlobal({ slug: "servicespage" });

  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

  return {
    title: pageConfig?.meta?.title || "Tjenester | Poynt",
    description: pageConfig?.meta?.description || "Se alle tjenester vi tilbyr",
    alternates: {
      canonical: `${baseUrl}/tjenester`,
    },
    openGraph: {
      title: pageConfig?.meta?.title || "Tjenester | Poynt",
      description:
        pageConfig?.meta?.description || "Se alle tjenester vi tilbyr",
      url: `${baseUrl}/tjenester`,
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
            <ServiceExplorer services={services.docs.map(toExplorerItem)} />
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
