import config from "@/payload.config";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { Button, Container, Heading, Text } from "@poynt/ui";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPayload } from "payload";

interface ServicePageProps {
  params: Promise<{
    slug: string;
  }>;
}

function formatPrice(service: {
  priceType: string;
  price?: number | null;
  includesVat?: boolean | null;
}): string {
  if (service.priceType === "contact") {
    return "Ta kontakt for pris";
  }

  if (!service.price) return "";

  const priceStr = service.price.toLocaleString("nb-NO");
  const vatSuffix = service.includesVat ? " + mva" : "";

  switch (service.priceType) {
    case "from":
      return `Fra ${priceStr} kr${vatSuffix}`;
    case "monthly":
      return `${priceStr} kr${vatSuffix} / mnd`;
    default:
      return `${priceStr} kr${vatSuffix}`;
  }
}

export async function generateMetadata({
  params,
}: ServicePageProps): Promise<Metadata> {
  const { slug } = await params;
  const payload = await getPayload({ config });

  const services = await payload.find({
    collection: "services",
    where: {
      slug: { equals: slug },
      active: { equals: true },
    },
    limit: 1,
  });

  if (services.docs.length === 0) {
    return { title: "Tjeneste ikke funnet" };
  }

  const service = services.docs[0];
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

  return {
    title: `${service.name} | Tjenester | Poynt`,
    description: service.shortDescription || "",
    alternates: {
      canonical: `${baseUrl}/tjenester/${slug}`,
    },
    openGraph: {
      title: service.name,
      description: service.shortDescription || "",
      url: `${baseUrl}/tjenester/${slug}`,
      type: "website",
      ...(service.image &&
        typeof service.image === "object" &&
        service.image.url && {
          images: [{ url: service.image.url }],
        }),
    },
  };
}

export default async function ServiceDetailPage({ params }: ServicePageProps) {
  const { slug } = await params;
  const payload = await getPayload({ config });

  const services = await payload.find({
    collection: "services",
    where: {
      slug: { equals: slug },
      active: { equals: true },
    },
    depth: 2,
    limit: 1,
  });

  if (services.docs.length === 0) {
    notFound();
  }

  const service = services.docs[0];

  return (
    <Container size="sm" padding="default">
      <article>
        {/* Back link */}
        <Link
          href="/tjenester"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Alle tjenester</span>
        </Link>

        {/* Header */}
        <header className="mb-8">
          <Heading size="h1">{service.name}</Heading>
          <p className="text-2xl font-semibold text-primary mb-4">
            {formatPrice(service)}
          </p>
          <Text variant={"lead"}>{service.shortDescription}</Text>
        </header>

        {/* Image */}
        {service.image &&
          typeof service.image === "object" &&
          service.image.url && (
            <div className="relative aspect-video w-full rounded-lg overflow-hidden mb-10 bg-muted">
              <Image
                src={service.image.url}
                alt={service.image.alt || service.name}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

        {/* Extended Content */}
        {service.content && (
          <div className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-a:text-primary prose-strong:text-foreground mb-10">
            <RichText data={service.content} />
          </div>
        )}

        {/* CTA */}
        <div className="bg-muted/50 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Interessert?</h2>
          <p className="text-muted-foreground mb-6">
            Ta kontakt for en uforpliktende prat om hvordan vi kan hjelpe deg.
          </p>
          <Button asChild size="lg">
            <Link href="/kontakt">Ta kontakt</Link>
          </Button>
        </div>
      </article>
    </Container>
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
