import config from "@/payload.config";
import { Heading, cn } from "@poynt/ui";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { getPayload } from "payload";
import { ServiceCard } from "../service-card";

interface ServicesArchiveBlockProps {
  title?: string;
  description?: string;
  layout?: "grid" | "list";
  showMoreLink?: boolean;
}

export async function ServicesArchiveBlock({
  title,
  description,
  layout = "grid",
  showMoreLink = false,
}: ServicesArchiveBlockProps) {
  const payload = await getPayload({ config });

  const services = await payload.find({
    collection: "services",
    where: {
      active: {
        equals: true,
      },
    },
    sort: "sortOrder",
    limit: 100,
  });

  if (!services.docs.length) {
    return null;
  }

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        {(title || description) && (
          <div className="mb-8 md:mb-12">
            {title && (
              <Heading size="h2" className="mb-3">
                {title}
              </Heading>
            )}
            {description && (
              <p className="text-lg text-muted-foreground max-w-2xl">
                {description}
              </p>
            )}
          </div>
        )}

        <div
          className={cn(
            layout === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
              : "flex flex-col gap-4 max-w-2xl"
          )}
        >
          {services.docs.map((service) => (
            <ServiceCard key={service.id} service={service as any} />
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
      </div>
    </section>
  );
}
