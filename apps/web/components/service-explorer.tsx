"use client";

import { type MediaResource, PayloadImage } from "@/components/payload-image";
import {
  ServiceShowcase,
  type ServiceShowcaseItem,
  type ServiceShowcaseLinkProps,
} from "@poynt/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

/** Klient-lenke for handlingsknappen → trigger kontaktmodalet (intercepting). */
function CtaLink({ href, className, children }: ServiceShowcaseLinkProps) {
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

/**
 * Stempler kontakt-CTA-en med kilde + emne + sti slik at innsendingen vet at
 * den kom fra en bestemt tjeneste. Lar andre mål-URL-er (egendefinert ctaLink)
 * stå urørt.
 */
function withContactSource(
  href: string | undefined,
  serviceName: string,
  pathname: string
): string | undefined {
  if (!href || !href.startsWith("/kontakt")) return href;
  const params = new URLSearchParams();
  params.set("kilde", `tjeneste:${serviceName}`);
  params.set("emne", serviceName);
  if (pathname) params.set("fra", pathname);
  return `/kontakt?${params.toString()}`;
}

export interface ServiceExplorerItem {
  id: string | number;
  name: string;
  price?: string;
  description: string;
  eyebrow?: string;
  /** Rene media-data (serialiserbart) — url/alt/fokuspunkt. */
  image?: MediaResource;
  ctaLabel?: string;
  ctaHref?: string;
  /** Vis som bredt kort over 2 kolonner. */
  featured?: boolean;
}

/**
 * Klient-wrapper som eier åpen/lukk-staten for `ServiceShowcase` (inline-expand)
 * og kobler `next/image` inn i bilde-slotten. Tjenestesiden sender inn ferdig
 * formaterte, serialiserbare data.
 */
export function ServiceExplorer({
  services,
}: {
  services: ServiceExplorerItem[];
}) {
  const [activeId, setActiveId] = useState<string | number | null>(null);
  const pathname = usePathname();

  const items: ServiceShowcaseItem[] = services.map((s) => ({
    id: s.id,
    name: s.name,
    price: s.price,
    description: s.description,
    eyebrow: s.eyebrow,
    featured: s.featured,
    ctaLabel: s.ctaLabel,
    ctaHref: withContactSource(s.ctaHref, s.name, pathname),
    image: s.image?.url ? (
      <PayloadImage
        media={s.image}
        alt={s.image.alt || s.name}
        fill
        className="object-cover"
      />
    ) : undefined,
  }));

  return (
    <ServiceShowcase
      services={items}
      activeId={activeId}
      onSelect={setActiveId}
      onClose={() => setActiveId(null)}
      ctaLinkComponent={CtaLink}
    />
  );
}
