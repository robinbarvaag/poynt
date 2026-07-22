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
    slug: service.slug,
    price: formatServicePrice(service),
    description: service.shortDescription,
    eyebrow: "Tjeneste",
    image: media ?? undefined,
    featured: service.featured ?? false,
  };
}

/**
 * Stempler en kontakt-CTA med kilde + emne (+ evt. sti) slik at innsendingen
 * vet hvor den kom fra. Andre mål-URL-er (egendefinert ctaLink) står urørt.
 * Uten `fromPath` kan en klient-lenke feste ?fra= selv (via usePathname).
 */
export function withContactSource(
  href: string,
  name: string,
  fromPath?: string,
  kind = "tjeneste"
): string {
  if (!href.startsWith("/kontakt")) return href;
  // Respekter params innholdet allerede har satt (f.eks. et emne som matcher
  // et konkret valg i «Hva gjelder det?») — fyll bare inn det som mangler.
  const [path, query] = href.split("?");
  const params = new URLSearchParams(query);
  if (!params.has("kilde")) params.set("kilde", `${kind}:${name}`);
  if (!params.has("emne")) params.set("emne", name);
  if (fromPath && !params.has("fra")) params.set("fra", fromPath);
  return `${path}?${params.toString()}`;
}
