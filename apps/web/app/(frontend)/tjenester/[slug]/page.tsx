import { AdminBar } from "@/components/admin-bar";
import { JsonLd } from "@/components/json-ld";
import { ServiceView } from "@/components/views/service-view";
import { SITE_URL, buildMetadata, notFoundMetadata } from "@/lib/seo";
import {
  breadcrumbSchema,
  faqSchema,
  serviceSchema,
} from "@/lib/structured-data";
import config from "@/payload.config";
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
  cacheLife("max");

  const payload = await getPayload({ config });

  const [services, servicesPage] = await Promise.all([
    payload.find({
      collection: "services",
      where: {
        slug: { equals: slug },
        active: { equals: true },
        _status: { equals: "published" },
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
    // SEO-fanens delingsbilde vinner over hovedbildet når det er satt.
    image: service.meta?.image || service.image,
    noIndex: service.meta?.noIndex ?? undefined,
    canonicalUrl: service.meta?.canonicalUrl,
  });
}

export default async function ServiceDetailPage({ params }: ServicePageProps) {
  const { slug } = await params;
  const { service, servicesPage } = await getServicePageData(slug);
  if (!service) {
    notFound();
  }

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
      <ServiceView service={service} cta={servicesPage?.detailCta} />
    </>
  );
}

export async function generateStaticParams() {
  const payload = await getPayload({ config });

  const services = await payload.find({
    collection: "services",
    where: {
      active: { equals: true },
      _status: { equals: "published" },
    },
    limit: 1000,
  });

  return services.docs.map((service) => ({
    slug: service.slug,
  }));
}
