"use client";

import { type MediaResource, PayloadImage } from "@/components/payload-image";
import {
  ServiceShowcaseGrid,
  type ServiceShowcaseItem,
  type ServiceShowcaseLinkProps,
} from "@poynt/ui";
import Link from "next/link";

/**
 * Klient-lenke for kortene: vanlig klientnavigasjon til /tjenester/[slug],
 * som fanges av @modal/(.)tjenester-interceptoren og vises som modal.
 */
function CardLink(props: ServiceShowcaseLinkProps) {
  return <Link {...props} scroll={false} />;
}

export interface ServiceExplorerItem {
  id: string | number;
  name: string;
  slug: string;
  price?: string;
  description: string;
  eyebrow?: string;
  /** Rene media-data (serialiserbart) — url/alt/fokuspunkt. */
  image?: MediaResource;
  /** Vis som bredt kort over 2 kolonner. */
  featured?: boolean;
}

/**
 * Tjeneste-oversikten som rute-drevet grid: hvert kort lenker til den ekte
 * tjenestesiden (crawlbart/delbart), mens klient-navigasjon intercepts og
 * viser tjenesten som modal med delt layout-animasjon fra kortet.
 */
export function ServiceExplorer({
  services,
}: {
  services: ServiceExplorerItem[];
}) {
  const items: ServiceShowcaseItem[] = services.map((s) => ({
    id: s.id,
    name: s.name,
    href: `/tjenester/${s.slug}`,
    price: s.price,
    description: s.description,
    eyebrow: s.eyebrow,
    featured: s.featured,
    image: s.image?.url ? (
      <PayloadImage
        media={s.image}
        alt={s.image.alt || s.name}
        fill
        className="object-cover"
      />
    ) : undefined,
  }));

  return <ServiceShowcaseGrid services={items} linkComponent={CardLink} />;
}
