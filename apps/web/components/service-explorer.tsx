"use client";

import { type MediaResource, PayloadImage } from "@/components/payload-image";
import { ServiceShowcase, type ServiceShowcaseItem } from "@poynt/ui";
import { useState } from "react";

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

  const items: ServiceShowcaseItem[] = services.map((s) => ({
    id: s.id,
    name: s.name,
    price: s.price,
    description: s.description,
    eyebrow: s.eyebrow,
    ctaLabel: s.ctaLabel,
    ctaHref: s.ctaHref,
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
    />
  );
}
