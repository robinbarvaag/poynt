import config from "@/payload.config";
import { PageHero } from "@/components/page-hero";
import { ServiceCard } from "@/components/service-card";
import { Container, Text } from "@poynt/ui";
import type { Metadata } from "next";
import { getPayload } from "payload";

export async function generateMetadata(): Promise<Metadata> {
  const payload = await getPayload({ config });
  const pageConfig = await payload.findGlobal({ slug: "servicespage" });

  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

  return {
    title: pageConfig?.meta?.title || "Tjenester | Poynt",
    description:
      pageConfig?.meta?.description || "Se alle tjenester vi tilbyr",
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
    pageConfig?.hero?.image && typeof pageConfig.hero.image === "object" && pageConfig.hero.image.url
      ? { url: pageConfig.hero.image.url, alt: pageConfig.hero.image.alt ?? undefined }
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

      <Container padding="default" className={heroEnabled ? "pt-0" : ""}>
        {services.docs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.docs.map((service) => (
              <ServiceCard key={service.id} service={service as any} />
            ))}
          </div>
        ) : (
          <Text variant="muted" className="text-center py-12">{emptyStateText}</Text>
        )}
      </Container>
    </>
  );
}
