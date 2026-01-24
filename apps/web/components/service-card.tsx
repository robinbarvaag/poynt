import { getMediaUrl } from "@/lib/media-url";
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
        <div className="relative aspect-[4/3] w-full bg-muted">
          <Image
            src={getMediaUrl(service.image.url)}
            alt={service.image.alt || service.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform"
          />
        </div>
      )}
      <div className="p-5">
        <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
          {service.name}
        </h3>
        <p className="text-primary font-medium mb-3">{formatPrice(service)}</p>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {service.shortDescription}
        </p>
      </div>
    </Link>
  );
}
