import { type MediaResource, PayloadImage } from "@/components/payload-image";
import { formatServicePrice } from "@/lib/service";
import { Heading, Text } from "@poynt/ui";
import Link from "next/link";

interface Service {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  image?: MediaResource;
  priceType: "fixed" | "from" | "monthly" | "contact";
  price?: number;
  includesVat?: boolean;
  ctaText?: string;
  ctaLink?: string;
}

interface ServiceCardProps {
  service: Service;
}

export function ServiceCard({ service }: ServiceCardProps) {
  const href = service.ctaLink || `/tjenester/${service.slug}`;

  return (
    <Link
      href={href}
      scroll={false}
      className="group block bg-muted/50 rounded-2xl overflow-hidden hover:bg-muted transition-colors"
    >
      {service.image && (
        <div className="relative aspect-4/3 w-full bg-muted">
          <PayloadImage
            media={service.image}
            alt={service.image.alt || service.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
        </div>
      )}
      <div className="p-5">
        <Heading
          variant="h4"
          color="foreground"
          weight="semibold"
          customStyles="mb-1 text-lg transition-colors group-hover:text-primary"
        >
          {service.name}
        </Heading>
        <Text type="p" color="primary" weight="medium" customStyles="mb-3">
          {formatServicePrice(service)}
        </Text>
        <Text variant="muted" customStyles="line-clamp-3">
          {service.shortDescription}
        </Text>
      </div>
    </Link>
  );
}
