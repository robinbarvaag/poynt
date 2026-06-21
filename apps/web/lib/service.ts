import type { ServiceExplorerItem } from "@/components/service-explorer";
import { resolveMedia } from "@/lib/payload";
import type { Service } from "@/payload-types";

/**
 * Formaterer prisen til en tjeneste til norsk visningstekst. Felles for
 * tjeneste-oversikten og tjeneste-detaljsida, så «Fra … kr», «… kr / mnd» og
 * «Ta kontakt for pris» ser likt ut begge steder.
 */
export function formatServicePrice(service: Service): string | undefined {
  if (service.priceType === "contact") {
    return "Ta kontakt for pris";
  }
  if (!service.price) {
    return undefined;
  }
  const price = service.price.toLocaleString("nb-NO");
  const vat = service.includesVat ? " + mva" : "";
  switch (service.priceType) {
    case "from":
      return `Fra ${price} kr${vat}`;
    case "monthly":
      return `${price} kr${vat} / mnd`;
    default:
      return `${price} kr${vat}`;
  }
}

/** Gjør en tjeneste om til kortdataene `ServiceExplorer` trenger. */
export function toServiceExplorerItem(service: Service): ServiceExplorerItem {
  const media = resolveMedia(service.image);

  return {
    id: service.id,
    name: service.name,
    price: formatServicePrice(service),
    description: service.shortDescription,
    eyebrow: "Tjeneste",
    ctaLabel: service.ctaText || "Ta kontakt",
    ctaHref: service.ctaLink || "/kontakt",
    image: media ?? undefined,
    featured: service.featured ?? false,
  };
}
