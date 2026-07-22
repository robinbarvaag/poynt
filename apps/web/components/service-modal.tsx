"use client";

import { type MediaResource, PayloadImage } from "@/components/payload-image";
import {
  type ServiceShowcaseItem,
  type ServiceShowcaseLinkProps,
  ServiceShowcaseModal,
} from "@poynt/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";

/** CTA-lenke i panelet → klientnavigasjon som trigger kontaktmodalet. */
function CtaLink(props: ServiceShowcaseLinkProps) {
  return <Link {...props} />;
}

export interface ServiceModalData {
  id: string | number;
  name: string;
  price?: string;
  description: string;
  eyebrow?: string;
  /** Rene media-data (serialiserbart) — url/alt/fokuspunkt. */
  image?: MediaResource;
  ctaLabel?: string;
  ctaHref?: string;
}

/**
 * Tjenestemodalet vist via @modal/(.)tjenester-interceptoren. Deler layoutId
 * med kortene i tjeneste-oversikten (morph derfra), faller ellers tilbake til
 * fade. Når exit-animasjonen er ferdig går vi ett steg tilbake i historikken,
 * så brukeren havner på siden modalet ble åpnet fra.
 */
export function ServiceModal({
  service,
  details,
}: {
  service: ServiceModalData;
  details?: React.ReactNode;
}) {
  const router = useRouter();

  const item: ServiceShowcaseItem = {
    ...service,
    details,
    image: service.image?.url ? (
      <PayloadImage
        media={service.image}
        alt={service.image.alt || service.name}
        fill
        className="object-cover"
      />
    ) : undefined,
  };

  return (
    <ServiceShowcaseModal
      service={item}
      onClosed={() => router.back()}
      ctaLinkComponent={CtaLink}
    />
  );
}
