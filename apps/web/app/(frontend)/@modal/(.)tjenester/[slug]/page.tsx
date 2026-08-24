import { ServiceModal } from "@/components/service-modal";
import { resolveMedia } from "@/lib/payload";
import { formatServicePrice, withContactSource } from "@/lib/service";
import config from "@/payload.config";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { cacheLife, cacheTag } from "next/cache";
import { getPayload } from "payload";
import { Suspense } from "react";

interface ModalPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Intercepting-route: fanger opp klient-navigasjon til /tjenester/[slug] og
 * viser tjenesten i et modal oppå siden brukeren står på (med delt
 * layout-animasjon fra kortet der det finnes). Ved refresh/direktelenke — og
 * for crawlere — faller man gjennom til den fulle tjenestesiden i stedet.
 */
async function getService(slug: string) {
  "use cache";
  cacheTag("cms");
  cacheLife("max");

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

  return services.docs[0] || null;
}

export default function InterceptedServicePage({ params }: ModalPageProps) {
  // params er runtime-data i en intercepting-route (ingen statiske params) —
  // les dem bak en Suspense-grense slik at navigasjonen forblir instant.
  return (
    <Suspense fallback={null}>
      <ServiceModalLoader params={params} />
    </Suspense>
  );
}

async function ServiceModalLoader({
  params,
}: {
  params: ModalPageProps["params"];
}) {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) return null;

  const media = resolveMedia(service.image);
  const ctaHref = withContactSource(
    service.ctaLink || "/kontakt",
    service.name,
    `/tjenester/${slug}`
  );

  return (
    <ServiceModal
      service={{
        id: service.id,
        name: service.name,
        price: formatServicePrice(service),
        description: service.shortDescription,
        eyebrow: "Tjeneste",
        image: media ?? undefined,
        ctaLabel: service.ctaText || "Ta kontakt",
        ctaHref,
      }}
      details={
        service.content ? (
          <div className="prose max-w-none prose-headings:text-foreground prose-p:text-foreground prose-a:text-primary prose-strong:text-foreground">
            <RichText data={service.content} />
          </div>
        ) : undefined
      }
    />
  );
}
