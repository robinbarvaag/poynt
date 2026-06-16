import { getMediaUrl } from "@/lib/media-url";
import { Heading, Text } from "@poynt/ui";
import Image from "next/image";
import Link from "next/link";

interface Service {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  image?: {
    url: string;
    alt?: string;
  };
  priceType: "fixed" | "from" | "monthly" | "contact";
  price?: number;
  includesVat?: boolean;
  ctaText?: string;
  ctaLink?: string;
}

interface ServiceCardProps {
  service: Service;
}

function formatPrice(service: Service): string {
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

export function ServiceCard({ service }: ServiceCardProps) {
  const href = service.ctaLink || `/tjenester/${service.slug}`;

  return (
    <Link
      href={href}
      className="group block bg-muted/50 rounded-2xl overflow-hidden hover:bg-muted transition-colors"
    >
      {service.image && (
        <div className="relative aspect-4/3 w-full bg-muted">
          <Image
            src={getMediaUrl(service.image.url)}
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
          {formatPrice(service)}
        </Text>
        <Text variant="muted" customStyles="line-clamp-3">
          {service.shortDescription}
        </Text>
      </div>
    </Link>
  );
}
