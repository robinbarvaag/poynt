import type { Service } from "@/payload-types";
import config from "@/payload.config";
import { BlockSection, Container, SectionHeader, cn } from "@poynt/ui";
import { ArrowRight } from "lucide-react";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { getPayload } from "payload";
import type { ComponentProps } from "react";
import { ServiceCard } from "../service-card";

interface ServicesArchiveBlockProps {
  title?: string;
  description?: string;
  selectionMode?: "auto" | "manual";
  selectedServices?: (string | number | Service)[];
  limit?: number;
  layout?: "grid" | "list";
  showMoreLink?: boolean;
}

/**
 * Cachet datahenting med KUN skalarer som argumenter — hele Service-dokumenter
 * som cache-nøkkel gir null treff og ubegrenset vekst (samme mønster som
 * product-archive-block).
 */
async function fetchArchiveServices(
  serviceIds: (string | number)[],
  limit: number | undefined
): Promise<Service[]> {
  "use cache";
  cacheTag("cms");
  cacheLife("minutes");

  const payload = await getPayload({ config });

  if (serviceIds.length > 0) {
    const result = await payload.find({
      collection: "services",
      where: {
        id: { in: serviceIds },
        active: { equals: true },
      },
      depth: 1,
      limit: 100,
    });

    // Behold rekkefølgen partneren valgte.
    return serviceIds
      .map((id) => result.docs.find((doc) => doc.id === id))
      .filter((doc): doc is Service => !!doc);
  }

  const result = await payload.find({
    collection: "services",
    where: {
      active: {
        equals: true,
      },
    },
    sort: "sortOrder",
    limit: limit || 100,
  });

  return result.docs;
}

export async function ServicesArchiveBlock({
  title,
  description,
  selectionMode = "auto",
  selectedServices,
  limit,
  layout = "grid",
  showMoreLink = false,
}: ServicesArchiveBlockProps) {
  const serviceIds =
    selectionMode === "manual" && selectedServices?.length
      ? selectedServices.map((s) => (typeof s === "object" ? s.id : s))
      : [];

  const docs = await fetchArchiveServices(serviceIds, limit);

  if (!docs.length) {
    return null;
  }

  return (
    <BlockSection background="default" containerSize={false}>
      <Container padding="none">
        <SectionHeader title={title} intro={description} reveal={false} />

        <div
          className={cn(
            layout === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              : "flex flex-col gap-4 max-w-2xl"
          )}
        >
          {docs.map((service) => (
            <ServiceCard
              key={service.id}
              service={
                service as unknown as ComponentProps<
                  typeof ServiceCard
                >["service"]
              }
            />
          ))}
        </div>

        {showMoreLink && (
          <div className="mt-8 text-center">
            <Link
              href="/tjenester"
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              Se alle tjenester
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </Container>
    </BlockSection>
  );
}
