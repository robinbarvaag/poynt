import { AdminBar } from "@/components/admin-bar";
import { CtaSectionBlock } from "@/components/blocks/cta-section-block";
import { JsonLd } from "@/components/json-ld";
import { MediaCredit } from "@/components/media-credit";
import { PayloadImage } from "@/components/payload-image";
import { resolveMedia } from "@/lib/payload";
import { SITE_URL, buildMetadata, notFoundMetadata } from "@/lib/seo";
import { formatServicePrice } from "@/lib/service";
import {
  breadcrumbSchema,
  faqSchema,
  serviceSchema,
} from "@/lib/structured-data";
import { detailBreadcrumbs } from "@/lib/ui-text";
import config from "@/payload.config";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { Breadcrumbs, Container, Heading, Text } from "@poynt/ui";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import { getPayload } from "payload";

interface ServicePageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function getServicePageData(slug: string) {
  "use cache";
  cacheTag("cms");
  cacheLife("minutes");

  const payload = await getPayload({ config });

  const [services, servicesPage] = await Promise.all([
    payload.find({
      collection: "services",
      where: {
        slug: { equals: slug },
        active: { equals: true },
      },
      depth: 2,
      limit: 1,
    }),
    payload.findGlobal({ slug: "servicespage" }),
  ]);

  return { service: services.docs[0] || null, servicesPage };
}

export async function generateMetadata({
  params,
}: ServicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const { service } = await getServicePageData(slug);
  if (!service) {
    return notFoundMetadata("Tjeneste ikke funnet");
  }

  return buildMetadata({
    title: service.meta?.title || `${service.name} | Tjenester`,
    description: service.meta?.description || service.shortDescription || "",
    path: `/tjenester/${slug}`,
    image: service.meta?.image || service.image,
    noIndex: service.meta?.noIndex ?? undefined,
  });
}

export default async function ServiceDetailPage({ params }: ServicePageProps) {
  const { slug } = await params;
  const { service, servicesPage } = await getServicePageData(slug);
  if (!service) {
    notFound();
  }

  const image = resolveMedia(service.image);
  const cta = servicesPage?.detailCta;

  const serviceUrl = `${SITE_URL}/tjenester/${slug}`;
  const jsonLd = [
    serviceSchema({
      name: service.name,
      description: service.shortDescription,
      image: service.image,
      url: serviceUrl,
      price: service.price,
    }),
    breadcrumbSchema([
      { name: "Hjem", url: SITE_URL },
      { name: "Tjenester", url: `${SITE_URL}/tjenester` },
      { name: service.name, url: serviceUrl },
    ]),
    faqSchema(service.faq),
  ].filter((schema): schema is NonNullable<typeof schema> => schema !== null);

  return (
    <>
      <AdminBar
        collection="services"
        id={String(service.id)}
        singular="tjeneste"
      />
      <JsonLd data={jsonLd} />
      <Container size="sm" padding="default">
        <article>
          <Breadcrumbs
            items={detailBreadcrumbs("tjenester", service.name)}
            className="mb-8"
          />

          {/* Header */}
          <header className="mb-8">
            <Heading variant="h1" color="foreground" weight="bold">
              {service.name}
            </Heading>
            <Text
              type="p"
              color="primary"
              weight="semibold"
              customStyles="mb-4 text-2xl"
            >
              {formatServicePrice(service)}
            </Text>
            <Text variant={"lead"}>{service.shortDescription}</Text>
          </header>

          {/* Image */}
          {image?.url && (
            <div className="relative mb-10 aspect-video w-full overflow-hidden rounded-3xl bg-muted">
              <PayloadImage
                media={image}
                alt={image.alt || service.name}
                fill
                className="object-cover"
                priority
              />
              <MediaCredit media={image} />
            </div>
          )}

          {/* Extended Content */}
          {service.content && (
            <div className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-a:text-primary prose-strong:text-foreground mb-10">
              <RichText data={service.content} />
            </div>
          )}
        </article>
      </Container>

      {/* Felles CTA, styrt fra Tjenesteoversikt-globalen */}
      {cta && (
        <CtaSectionBlock
          variant={cta.variant ?? "colored"}
          title={cta.title || "Interessert?"}
          description={cta.description ?? undefined}
          primaryCta={{
            text: cta.primaryCta?.text || "Ta kontakt",
            url: cta.primaryCta?.url || "/kontakt",
          }}
        />
      )}
    </>
  );
}

export async function generateStaticParams() {
  const payload = await getPayload({ config });

  const services = await payload.find({
    collection: "services",
    where: {
      active: { equals: true },
    },
    limit: 1000,
  });

  return services.docs.map((service) => ({
    slug: service.slug,
  }));
}
